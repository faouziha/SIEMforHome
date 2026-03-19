import os
import shutil
import string
import platform
import subprocess

# We import the model inside the function to avoid circular import issues
# since this is inside the /utils/ folder

def find_tshark_globally():
    """
    Looks for TShark in DB first, then PATH, then .env, then common paths.
    """
    # 1. Check Database first (User Preference)
    try:
        from SIEMapp.models import SystemSettings
        config = SystemSettings.objects.filter(id=1).first()
        if config and config.tshark_path and os.path.exists(config.tshark_path):
            return config.tshark_path
    except Exception:
        # This handles cases where migrations haven't run yet or we are outside Django context
        pass

    # 2. Check System PATH
    path = shutil.which("tshark")
    if path: return path

    # 3. Check Environment Variable
    path = os.getenv("TSHARK_PATH")
    if path and os.path.exists(path): return path

    # 4. Targeted Drive Search (Windows Only)
    if platform.system() == "Windows":
        drives = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
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
            # We use the path we found (from DB or Auto-detect) to get interfaces
            output = subprocess.check_output([tshark_path, "-D"], text=True)
            status["available_interfaces"] = [line.strip() for line in output.strip().split('\n')]
        except:
            pass
            
    return status