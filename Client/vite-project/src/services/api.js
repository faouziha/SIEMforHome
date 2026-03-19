import axios from 'axios';

// The URL where your Django server is running
const API_BASE_URL = 'http://127.0.0.1:8000/api/';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const securityService = {
    // Fetch the 7 devices found by Nmap
    getDevices: () => apiClient.get('devices/'),
    
    // Fetch the security alerts from TShark/Nmap
    getAlerts: () => apiClient.get('alerts/'),
    
    // Future: Trigger a new scan from the UI
    runNetworkScan: () => apiClient.post('devices/scan/'),

    getRiskSummary: () => apiClient.get('devices/risk-summary/'),

    resolveAlert: (id) => apiClient.post(`alerts/${id}/resolve/`),

    getSettings: () => apiClient.get('settings/'),
    updateSettings: (data) => apiClient.post('settings/', data),
};