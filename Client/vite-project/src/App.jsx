import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DevicesPage from './pages/Devices';
import AlertsPage from './pages/Alerts';
import ScansPage from './pages/Scans';
// Import other pages as you create them

function App() {
  return (
    <div className="flex min-h-screen w-full bg-[#0d1117] text-white overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/view/dashboard" />} />

          <Route path="/view/dashboard" element={<Dashboard />} />

          {/* We will build these next */}
          <Route path="/view/devices" element={<DevicesPage />} />
          <Route path="/view/alerts" element={<AlertsPage />} />
          <Route path="/view/scans" element={<ScansPage />} />
          <Route
            path="/view/settings"
            element={<div className="p-8 text-white">Settings Coming Soon</div>}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
