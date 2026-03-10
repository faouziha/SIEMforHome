import sys
import os
import subprocess
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Device, Alert
from .serializers import DeviceSerializer, AlertSerializer

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all().order_by('-last_seen')
    serializer_class = DeviceSerializer

    @action(detail=False, methods=['post'], url_path='scan')
    def scan(self, request):
        try:
            python_exe = sys.executable
            manage_py = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'manage.py')
            
            # 1. Force UTF-8 environment variables
            env = os.environ.copy()
            env["PYTHONIOENCODING"] = "utf-8"
            env["PYTHONUTF8"] = "1"

            # 2. Run with explicit encoding and error handling
            result = subprocess.run(
                [python_exe, manage_py, "network_scan"],
                capture_output=True,
                text=True,
                encoding='utf-8',      # Force UTF-8
                errors='replace',     # If it finds a weird byte, replace it with '?' instead of crashing
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

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer