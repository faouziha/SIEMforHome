from rest_framework import serializers
from .models import Device, Alert

class DeviceSerializer(serializers.ModelSerializer):
    """
    Converts Device models into JSON.
    Includes fields for MAC, IP, Hostname, and Vendor.
    """
    class Meta:
        model = Device
        fields = '__all__'  # This includes all fields like mac_address, hostname, etc.

class AlertSerializer(serializers.ModelSerializer):
    """
    Converts Alert models into JSON.
    Links the device name to the alert for easier reading in React.
    """
    # Read-only field to show the hostname of the related device in the JSON output
    device_hostname = serializers.ReadOnlyField(source='related_device.hostname')

    class Meta:
        model = Alert
        fields = '__all__'