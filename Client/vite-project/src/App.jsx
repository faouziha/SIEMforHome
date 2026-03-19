import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DevicesPage from './pages/Devices';
import AlertsPage from './pages/Alerts';
import ScansPage from './pages/Scans';
import SettingsPage from './pages/SettingsPage';
import TopologyPage from './pages/TopologyPage';
// Import other pages as you create them

function App() {
  return (
    <div className="flex min-h-screen w-full bg-[#0d1117] text-white overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto mt-10 md:mt-0">
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/view/dashboard" />} />

          <Route path="/view/dashboard" element={<Dashboard />} />

          {/* We will build these next */}
          <Route path="/view/devices" element={<DevicesPage />} />
          <Route path="/view/alerts" element={<AlertsPage />} />
          <Route path="/view/scans" element={<ScansPage />} />
          <Route path="/view/settings" element={<SettingsPage />} />
          <Route path="/view/topology" element={<TopologyPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
