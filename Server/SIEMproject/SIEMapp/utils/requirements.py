import os
import shutil
import string
import platform
import subprocess

def find_tshark_globally():
    """
    Looks for TShark in PATH, then .env, then common paths on all available drives.
    """
    # 1. Check System PATH
    path = shutil.which("tshark")
    if path: return path

    # 2. Check Environment Variable
    path = os.getenv("TSHARK_PATH")
    if path and os.path.exists(path): return path

    # 3. Targeted Drive Search (Windows Only)
    if platform.system() == "Windows":
        # Get all drive letters currently connected (C:, D:, etc.)
        drives = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
        
        # Common installation sub-folders
        sub_folders = [
            r"Wireshark\tshark.exe",
            r"Program Files\Wireshark\tshark.exe",
            r"Program Files (x86)\Wireshark\tshark.exe",
        ]

        for drive in drives:
            for folder in sub_folders:
                full_path = os.path.join(drive, folder)
                if os.path.exists(full_path):
                    return full_path
    
    return None

def validate_siem_env():
    status = {
        "engine_found": False,
        "engine_path": None,
        "has_admin_privileges": False,
        "available_interfaces": []
    }

    tshark_path = find_tshark_globally()

    if tshark_path:
        status["engine_found"] = True
        status["engine_path"] = tshark_path
        
        # Check Admin
        if platform.system() == "Windows":
            import ctypes
            status["has_admin_privileges"] = ctypes.windll.shell32.IsUserAnAdmin() != 0
        
        # List Interfaces
        try:
            output = subprocess.check_output([tshark_path, "-D"], text=True)
            status["available_interfaces"] = [line.strip() for line in output.strip().split('\n')]
        except:
            pass
            
    return status