from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Alert, Device


class AlertHistoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dev = Device.objects.create(mac_address="AA:BB:CC:DD:EE:01",
                                         ip_address="192.168.1.10", hostname="cam")
        now = timezone.now()

        def make(sev, ago, resolved=False, device=None, kind="Port Scan"):
            a = Alert.objects.create(alert_type=kind, description="x", severity=sev,
                                     related_device=device, is_resolved=resolved)
            # timestamp is auto_now_add, so backdate with an update
            Alert.objects.filter(pk=a.pk).update(timestamp=now - ago)

        make("High", timedelta(days=1), device=self.dev)
        make("High", timedelta(days=1), resolved=True, device=self.dev)
        make("LOW", timedelta(days=3))  # legacy default casing
        make("Critical", timedelta(days=5), kind="Brute Force")
        make("Medium", timedelta(days=40))  # outside a 30-day window

    def test_daily_history(self):
        r = self.client.get("/api/alerts/history/?days=30")
        self.assertEqual(r.status_code, 200)
        d = r.json()
        self.assertEqual(d["granularity"], "day")
        self.assertEqual(d["totals"]["total"], 4)
        self.assertEqual(d["totals"]["resolved"], 1)
        self.assertEqual(d["by_severity"], {"Low": 1, "Medium": 0, "High": 2, "Critical": 1})
        self.assertEqual(len(d["timeline"]), 31)  # zero-filled, inclusive of today
        self.assertEqual(sum(sum(b[s] for s in ("Low", "Medium", "High", "Critical"))
                             for b in d["timeline"]), 4)
        self.assertEqual(sum(map(sum, d["heatmap"])), 4)
        self.assertEqual(d["top_devices"][0]["count"], 2)
        self.assertEqual(d["by_type"][0], {"alert_type": "Port Scan", "count": 3})
        self.assertEqual(d["totals"]["peak_count"], 2)

    def test_hourly_and_bounds(self):
        d = self.client.get("/api/alerts/history/?days=1").json()
        self.assertEqual(d["granularity"], "hour")
        self.assertIn(len(d["timeline"]), (24, 25))
        self.assertEqual(self.client.get("/api/alerts/history/?days=abc").json()["range_days"], 30)
        self.assertEqual(self.client.get("/api/alerts/history/?days=9999").json()["range_days"], 365)


class DeviceRenameTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dev = Device.objects.create(mac_address="AA:BB:CC:DD:EE:02", ip_address="192.168.1.22",
                                         hostname="Device-192.168.1.22", vendor="Samsung")

    def test_set_and_clear_nickname(self):
        r = self.client.patch(f"/api/devices/{self.dev.pk}/", {"nickname": "Living-room TV"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["nickname"], "Living-room TV")
        self.assertIn("services", r.json())
        self.dev.refresh_from_db()
        self.assertEqual(self.dev.nickname, "Living-room TV")
        self.assertEqual(self.dev.mac_address, "AA:BB:CC:DD:EE:02")  # partial update leaves the rest

        r = self.client.patch(f"/api/devices/{self.dev.pk}/", {"nickname": None}, format="json")
        self.assertEqual(r.status_code, 200)
        self.dev.refresh_from_db()
        self.assertIsNone(self.dev.nickname)

    def test_rename_does_not_touch_last_seen(self):
        old = timezone.now() - timedelta(days=3)
        Device.objects.filter(pk=self.dev.pk).update(last_seen=old)
        self.client.patch(f"/api/devices/{self.dev.pk}/", {"nickname": "NAS"}, format="json")
        self.dev.refresh_from_db()
        self.assertEqual(self.dev.last_seen, old)

    def test_nickname_too_long_rejected(self):
        r = self.client.patch(f"/api/devices/{self.dev.pk}/", {"nickname": "x" * 101}, format="json")
        self.assertEqual(r.status_code, 400)
