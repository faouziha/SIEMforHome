import subprocess
from django.core.management.base import BaseCommand
from SIEMapp.utils.requirements import validate_siem_env
from SIEMapp.models import Alert, Device

class Command(BaseCommand):
    help = 'Starts the TShark engine to monitor network traffic'

    def handle(self, *args, **options):
        env = validate_siem_env()
        
        if not env['engine_found']:
            self.stdout.write(self.style.ERROR("❌ TShark not found!"))
            return

        self.stdout.write(self.style.SUCCESS(f"🚀 Engine Started: {env['engine_path']}"))
        
        # 1. TShark Command
        tshark_cmd = [
            env['engine_path'],
            '-i', '5', 
            '-l', 
            '-n', 
            '-T', 'fields',
            '-e', 'ip.src',
            '-e', 'ip.dst',
            '-e', 'tcp.port',
            '-e', 'frame.protocols',
            '-E', 'separator=|',
            '-f', 'tcp port 80 or tcp port 21' # Filter out the noise (443) at the source
        ]

        process = subprocess.Popen(tshark_cmd, stdout=subprocess.PIPE, text=True)
        self.stdout.write(self.style.SUCCESS("✅ Sniffer is live..."))

        for line in process.stdout:
            line = line.strip()
            if not line: continue
            
            try:
                parts = line.split('|')
                if len(parts) >= 3:
                    src_ip = parts[0]
                    dst_ip = parts[1]
                    port = parts[2]
                    protocol_stack = parts[3] if len(parts) > 3 else "Unknown"

                    # --- LOGIC START ---
                    
                    # 1. Define variables first
                    severity = "High"
                    alert_type = "Insecure Protocol Detected"
                    
                    # 2. Get or Create the device so the ForeignKey doesn't fail
                    device, created = Device.objects.get_or_create(
                        ip_address=src_ip,
                        defaults={'name': f"Unknown ({src_ip})", 'status': 'Active'}
                    )

                    # 3. Create the Alert
                    Alert.objects.create(
                        alert_type=alert_type,
                        description=f"Insecure protocol ({protocol_stack}) from {src_ip} to {dst_ip} on port {port}",
                        severity=severity,
                        related_device=device,
                        is_resolved=False
                    )
                    
                    self.stdout.write(self.style.WARNING(f"🚨 ALERT SAVED: {src_ip} -> Port {port}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Processing Error: {e}"))