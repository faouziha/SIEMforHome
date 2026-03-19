from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, AlertViewSet, SettingsViewSet

router = DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'settings', SettingsViewSet, basename='settings')

urlpatterns = [
    path('api/', include(router.urls)),
]