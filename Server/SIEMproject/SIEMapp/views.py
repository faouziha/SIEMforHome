import sys
import os
import subprocess
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Device, Alert
from .serializers import DeviceSerializer, AlertSerializer
from .utils.requirements import validate_siem_env
from .models import Device, Alert, SystemSettings
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncHour
from django.utils import timezone

SEVERITIES = ['Low', 'Medium', 'High', 'Critical']


def _norm_severity(value):
    """Map stored severity (incl. legacy 'LOW') onto the canonical labels."""
    v = (value or 'Low').strip().capitalize()
    return v if v in SEVERITIES else 'Low'

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.prefetch_related('services').order_by('-last_seen')
    serializer_class = DeviceSerializer

    @action(detail=False, methods=['post'], url_path='scan')
    def scan(self, request):
        try:
            python_exe = sys.executable
            manage_py = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'manage.py')
            
            env = os.environ.copy()
            env["PYTHONIOENCODING"] = "utf-8"
            env["PYTHONUTF8"] = "1"

            result = subprocess.run(
                [python_exe, manage_py, "network_scan"],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                env=env,
                cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            )

            combined_output = result.stdout + result.stderr
            
            return Response({
                "status": "success",
                "raw_output": combined_output or "Scan completed."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # NEW: Now correctly indented inside the class!
    @action(detail=False, methods=['get'], url_path='risk-summary')
    def risk_summary(self, request):
        total_alerts = Alert.objects.filter(is_resolved=False).count()
        high_alerts = Alert.objects.filter(severity="High", is_resolved=False).count()
        medium_alerts = Alert.objects.filter(severity="Medium", is_resolved=False).count()
        
        # Risk Calculation Logic
        score = (high_alerts * 10) + (medium_alerts * 5)
        risk_level = "Low"
        if score > 70: risk_level = "Critical"
        elif score > 40: risk_level = "High"
        elif score > 15: risk_level = "Medium"

        return Response({
            "score": min(score, 100),
            "risk_level": risk_level,
            "counts": {
                "high": high_alerts,
                "medium": medium_alerts,
                "total": total_alerts
            }
        }, status=status.HTTP_200_OK)

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        """Aggregated alert history for the exposure-history charts.

        ?days=N (1-365, default 30). For days <= 2 the timeline is bucketed
        by hour, otherwise by day. Empty buckets are filled with zeros.
        """
        try:
            days = int(request.query_params.get('days', 30))
        except ValueError:
            days = 30
        days = max(1, min(days, 365))

        now = timezone.now()
        start = now - timedelta(days=days)
        qs = Alert.objects.filter(timestamp__gte=start)

        hourly = days <= 2
        trunc = TruncHour('timestamp') if hourly else TruncDate('timestamp')
        step = timedelta(hours=1) if hourly else timedelta(days=1)

        # --- Timeline: one row per bucket, counts per severity ---
        rows = qs.annotate(bucket=trunc).values('bucket', 'severity').annotate(n=Count('id'))
        local_now = timezone.localtime(now)
        local_start = timezone.localtime(start)
        if hourly:
            cursor = local_start.replace(minute=0, second=0, microsecond=0)
            key = lambda d: timezone.localtime(d).strftime('%Y-%m-%dT%H:00')
        else:
            cursor = local_start.date()
            key = lambda d: d.isoformat()
        end = local_now if hourly else local_now.date()
        buckets = {}
        while cursor <= end:
            k = cursor.strftime('%Y-%m-%dT%H:00') if hourly else cursor.isoformat()
            buckets[k] = {s: 0 for s in SEVERITIES}
            cursor += step
        for r in rows:
            if r['bucket'] is None:
                continue
            k = key(r['bucket'])
            sev = _norm_severity(r['severity'])
            buckets.setdefault(k, {s: 0 for s in SEVERITIES})[sev] += r['n']
        timeline = [{'bucket': k, **v} for k, v in sorted(buckets.items())]

        # --- Weekday x hour heatmap (local time, Monday = 0) ---
        heatmap = [[0] * 24 for _ in range(7)]
        for ts in qs.values_list('timestamp', flat=True):
            lt = timezone.localtime(ts)
            heatmap[lt.weekday()][lt.hour] += 1

        # --- Breakdowns ---
        by_severity = {s: 0 for s in SEVERITIES}
        for r in qs.values('severity').annotate(n=Count('id')):
            by_severity[_norm_severity(r['severity'])] += r['n']

        by_type = list(
            qs.values('alert_type').annotate(count=Count('id')).order_by('-count')[:8]
        )
        top_devices = [
            {
                'device': r['related_device__nickname'] or r['related_device__hostname']
                          or r['related_device__ip_address'] or 'Unknown',
                'ip': r['related_device__ip_address'],
                'count': r['count'],
            }
            for r in qs.exclude(related_device=None)
                       .values('related_device__nickname', 'related_device__hostname',
                               'related_device__ip_address')
                       .annotate(count=Count('id')).order_by('-count')[:8]
        ]

        total = qs.count()
        resolved = qs.filter(is_resolved=True).count()
        prev_total = Alert.objects.filter(timestamp__gte=start - timedelta(days=days),
                                          timestamp__lt=start).count()
        peak = max(timeline, key=lambda b: sum(b[s] for s in SEVERITIES), default=None)

        return Response({
            'range_days': days,
            'granularity': 'hour' if hourly else 'day',
            'totals': {
                'total': total,
                'resolved': resolved,
                'open': total - resolved,
                'previous_period': prev_total,
                'peak_bucket': peak['bucket'] if peak and sum(peak[s] for s in SEVERITIES) else None,
                'peak_count': sum(peak[s] for s in SEVERITIES) if peak else 0,
            },
            'timeline': timeline,
            'by_severity': by_severity,
            'by_type': by_type,
            'top_devices': top_devices,
            'heatmap': heatmap,
        })

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.save()
        
        # When an alert is resolved, the Risk Score should change!
        return Response({"status": "Alert marked as resolved"}, status=status.HTTP_200_OK)
    
class SettingsViewSet(viewsets.ViewSet):
    def list(self, request):
        # Get saved settings OR auto-detect if none exist
        config, _ = SystemSettings.objects.get_or_create(id=1)
        env_status = validate_siem_env() # Your requirement.py logic
        
        return Response({
            "saved_tshark": config.tshark_path,
            "auto_detected": env_status["engine_path"],
            "interfaces": env_status["available_interfaces"],
            "is_admin": env_status["has_admin_privileges"]
        })

    def create(self, request):
        config, _ = SystemSettings.objects.get_or_create(id=1)
        config.tshark_path = request.data.get("tshark_path", config.tshark_path)
        config.save()
        return Response({"status": "Settings Updated"})