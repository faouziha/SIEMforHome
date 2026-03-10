import nmap
import sys
from SIEMapp.models import Device, NetworkService, NetworkScan

def scan_network(network_range="192.168.100.0/24"):
    nmap_executable = r"D:\Nmap\nmap.exe"
    output_log = []
    
    def log_msg(msg):
        print(msg, flush=True)
        output_log.append(msg)

    try:
        nm = nmap.PortScanner(nmap_search_path=(nmap_executable,))
        log_msg(f"🔎 STARTING RECONNAISSANCE: {network_range}")
        
        nm.scan(hosts=network_range, arguments='-sV --top-ports 20')
        
        hosts_found = nm.all_hosts()
        
        # Save the Scan Summary to the NetworkScan table
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
                
                # Clear and save Services to NetworkService table
                NetworkService.objects.filter(device=device).delete()

                for proto in nm[host].all_protocols():
                    for port in nm[host][proto].keys():
                        s_name = nm[host][proto][port].get('name', 'unknown')
                        
                        NetworkService.objects.create(
                            device=device,
                            port=port,
                            protocol=proto,
                            service_name=s_name,
                            is_secure=port not in [21, 23, 80]
                        )
                        log_msg(f"   [+] Port {port}/{proto}: {s_name}")
                
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