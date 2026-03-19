from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Device(models.Model):
    mac_address = models.CharField(max_length=17, unique=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    hostname = models.CharField(max_length=255, blank=True, null=True)
    vendor = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)
    is_whitelisted = models.BooleanField(default=False)
    os_type = models.CharField(max_length=50, blank=True, null=True)
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nickname or self.mac_address
    

class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True)
    alert_type = models.CharField(max_length=100)
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='LOW')
    related_device = models.ForeignKey(Device, on_delete=models.CASCADE, null=True, blank=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.alert_type} on {self.related_device} at {self.timestamp}"
    
class NetworkService(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='services')
    port = models.IntegerField()
    protocol = models.CharField(max_length=10)
    service_name = models.CharField(max_length=100, blank=True, null=True)
    is_secure = models.BooleanField(default=True)

class TrafficLog(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    bytes_sent = models.BigIntegerField(default=0)
    bytes_received = models.BigIntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

class BlockList(models.Model):
    mac_address = models.CharField(max_length=17, unique=True)
    reason = models.TextField(blank=True)
    blocked_at = models.DateTimeField(auto_now_add=True)

class NetworkScan(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    devices_found = models.IntegerField()
    scan_type = models.CharField(max_length=50)


class SystemSettings(models.Model):
    tshark_path = models.CharField(max_length=500, default="")
    nmap_path = models.CharField(max_length=500, default="")
    interface = models.CharField(max_length=100, default="1")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return "System Configuration"