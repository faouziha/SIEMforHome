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

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all().order_by('-last_seen')
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