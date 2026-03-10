import React, { createContext, useState, useEffect } from 'react';
import { securityService } from '../services/api';

export const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
    const [devices, setDevices] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        try {
            const [deviceRes, alertRes] = await Promise.all([
                securityService.getDevices(),
                securityService.getAlerts()
            ]);
            setDevices(deviceRes.data);
            setAlerts(alertRes.data);
        } catch (error) {
            console.error("Error fetching security data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        // Polling: Refresh every 30 seconds to catch new TShark alerts
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SecurityContext.Provider value={{ devices, alerts, loading, refreshData }}>
            {children}
        </SecurityContext.Provider>
    );
};