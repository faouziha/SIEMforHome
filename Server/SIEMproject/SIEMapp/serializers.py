from rest_framework import serializers
from .models import Device, Alert, NetworkService


class NetworkServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NetworkService
        fields = ['port', 'protocol', 'service_name', 'is_secure']


class DeviceSerializer(serializers.ModelSerializer):
    """
    Converts Device models into JSON.
    Includes fields for MAC, IP, Hostname, and Vendor, plus open services.
    """
    services = NetworkServiceSerializer(many=True, read_only=True)

    def update(self, instance, validated_data):
        # Only write the fields that were sent. Without update_fields, save()
        # would also bump the auto_now `last_seen`, so renaming a device would
        # make it look like it was just seen on the network.
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save(update_fields=list(validated_data.keys()) or None)
        return instance

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