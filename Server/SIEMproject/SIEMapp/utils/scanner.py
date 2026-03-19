import nmap
import sys
# Added Alert to imports
from SIEMapp.models import Device, NetworkService, NetworkScan, Alert

# Define our security ruleset
DANGEROUS_PORTS = {
    21: {"name": "FTP", "severity": "Medium", "desc": "Insecure file transfer (plain text passwords)."},
    23: {"name": "Telnet", "severity": "High", "desc": "Highly insecure remote access detected."},
    80: {"name": "HTTP", "severity": "Low", "desc": "Unencrypted web traffic detected. Use HTTPS (443) if possible."},
    3389: {"name": "RDP", "severity": "High", "desc": "Remote Desktop exposed; common target for brute force."},
}

def scan_network(network_range="192.168.100.0/24"):
    nmap_executable = r"D:\Nmap\nmap.exe"
    output_log = []
    
    def log_msg(msg):
        print(msg, flush=True)
        output_log.append(msg)

    try:
        nm = nmap.PortScanner(nmap_search_path=(nmap_executable,))
        log_msg(f"🔎 STARTING SECURITY AUDIT: {network_range}")
        
        nm.scan(hosts=network_range, arguments='-sV --top-ports 20')
        hosts_found = nm.all_hosts()
        
        NetworkScan.objects.create(
            devices_found=len(hosts_found),
            scan_type="Service Discovery (-sV)"
        )

        for host in hosts_found:
            ip = host
            mac = nm[host]['addresses'].get('mac')
            hostname = nm[host].hostname() or f"Device-{ip}"
            
            log_msg(f"\n📡 Host identified: {hostname} ({ip})")

            if mac:
                device, _ = Device.objects.update_or_create(
                    mac_address=mac,
                    defaults={'ip_address': ip, 'hostname': hostname}
                )
                
                NetworkService.objects.filter(device=device).delete()

                for proto in nm[host].all_protocols():
                    for port in nm[host][proto].keys():
                        s_name = nm[host][proto][port].get('name', 'unknown')
                        
                        NetworkService.objects.create(
                            device=device,
                            port=port,
                            protocol=proto,
                            service_name=s_name,
                            is_secure=port not in DANGEROUS_PORTS
                        )
                        log_msg(f"   [+] Port {port}/{proto}: {s_name}")

                        # --- AUTO-ALERT LOGIC ---
                        if port in DANGEROUS_PORTS:
                            rule = DANGEROUS_PORTS[port]
                            # Using get_or_create prevents duplicate alerts for the same device/port
                            alert, created = Alert.objects.get_or_create(
                                related_device=device,
                                alert_type=f"Insecure Service: {rule['name']}",
                                is_resolved=False,
                                defaults={
                                    'severity': rule['severity'],
                                    'description': f"Vulnerability detected on port {port}: {rule['desc']}"
                                }
                            )
                            if created:
                                log_msg(f"   ⚠️  SECURITY ALERT GENERATED: {rule['name']} detected!")
                
                log_msg(f"✅ Sync to PostgreSQL: {hostname}")
            else:
                log_msg(f"⚠️ Warning: No MAC for {ip}. (Common for Host/Router)")

        final_summary = f"Scan complete! Found {len(hosts_found)} devices."
        log_msg(f"\n✨ {final_summary}")
        return "\n".join(output_log)

    except Exception as e:
        error_text = f"CRITICAL ERROR: {str(e)}"
        log_msg(error_text)
        return error_text