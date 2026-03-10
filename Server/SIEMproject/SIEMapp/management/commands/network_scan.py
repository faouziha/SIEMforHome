from django.core.management.base import BaseCommand
from SIEMapp.utils.scanner import scan_network
import os

class Command(BaseCommand):
    help = 'Diagnostic Nmap Wrapper'

    def handle(self, *args, **options):
        self.stdout.write("--- DEBUG: COMMAND STARTED ---")
        
        # Check if we can even see the Nmap executable from here
        nmap_path = r"D:\Nmap\nmap.exe"
        if os.path.exists(nmap_path):
            self.stdout.write(f"CONFIRMED: Nmap found at {nmap_path}")
        else:
            self.stdout.write(f"ERROR: Nmap NOT FOUND at {nmap_path}")
            return # Stop here if path is wrong

        try:
            # Trigger the actual scanner
            result = scan_network("192.168.100.0/24")
            
            # Write whatever the scanner produced
            self.stdout.write(result)
            self.stdout.write("--- DEBUG: COMMAND FINISHED ---")
        except Exception as e:
            self.stdout.write(f"CRITICAL SCANNER FAILURE: {str(e)}")