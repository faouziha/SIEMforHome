import React, { useState, useEffect, useContext } from "react";
import { SecurityContext } from "../context/SecurityContext";
import DeviceTable from "../components/DeviceTable";
// import Sidebar from "../components/Sidebar";
import RiskGauge from "../components/RiskGauge";
import { securityService } from "../services/api";

const Dashboard = () => {
  const { devices, alerts, loading } = useContext(SecurityContext);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await securityService.getRiskSummary();
        setSummary(response.data);
      } catch (err) {
        console.error("Failed to fetch risk summary", err);
      }
    };
    fetchSummary();
  }, [alerts]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117]">
        <div className="text-matrix-green text-xl font-mono animate-pulse">
          [SYSTEM INITIALIZING...]
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-white">
      {/* If you have a Sidebar, it goes here */}

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-matrix-green/30 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-matrix-green uppercase tracking-widest">
              DevSec | Network Monitor
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">
              Location: Fes, Morocco | Active Nodes: {devices.length}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 font-mono">
            V 1.0.4 | SECURE_OS
          </div>
        </header>

        {/* Risk Assessment Section */}
        <section className="mb-10">
          <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
            Security Command Center
          </h2>
          {summary && <RiskGauge summary={summary} />}
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#161b22] p-6 border-l-4 border-matrix-green shadow-lg hover:bg-[#1c2128] transition-colors">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider">
              Total Devices
            </h3>
            <p className="text-4xl font-bold mt-2">{devices.length}</p>
          </div>
          <div className="bg-[#161b22] p-6 border-l-4 border-red-500 shadow-lg hover:bg-[#1c2128] transition-colors">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider">
              Active Alerts
            </h3>
            <p className="text-4xl font-bold text-red-500 mt-2">
              {alerts.filter((a) => !a.is_resolved).length}
            </p>
          </div>
          <div className="bg-[#161b22] p-6 border-l-4 border-blue-500 shadow-lg hover:bg-[#1c2128] transition-colors">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider">
              Network Health
            </h3>
            <p className="text-4xl font-bold text-blue-400 mt-2">
              {summary?.risk_level === "Low" ? "STABLE" : "VULNERABLE"}
            </p>
          </div>
        </div>

        {/* Main Asset Table */}
        <section className="bg-[#161b22] rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl mb-6 text-matrix-green uppercase tracking-wider font-bold">
            Discovered Assets
          </h2>
          <DeviceTable devices={devices} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
