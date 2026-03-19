import React, { useState, useEffect, useContext } from "react";
import { SecurityContext } from "../context/SecurityContext";
import DeviceTable from "../components/DeviceTable";
// import Sidebar from "../components/Sidebar";
import RiskGauge from "../components/RiskGauge";
import { securityService } from "../services/api";

const Dashboard = () => {
  const { devices, alerts, loading } = useContext(SecurityContext);
  const [summary, setSummary] = useState(null);
  const [location, setLocation] = useState("DETECTING_LOCATION...");

  // 1st Hook: Fetch Risk Summary
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

  // 2nd Hook: Fetch Location (Bulletproof GeoJS API)
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");

        if (!res.ok) throw new Error("API blocked request");

        const data = await res.json();

        if (data.city && data.country) {
          setLocation(`${data.city}, ${data.country}`);
        } else {
          setLocation("LOCAL_NETWORK");
        }
      } catch (error) {
        console.error("Location fetch failed:", error);
        setLocation("OFFLINE_MODE");
      }
    };
    fetchLocation();
  }, []);

  // EARLY RETURNS MUST GO AFTER ALL HOOKS
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117]">
        <div className="text-matrix-green text-lg md:text-xl font-mono animate-pulse px-4 text-center">
          [SYSTEM INITIALIZING...]
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-white overflow-hidden">
      {/* If you have a Sidebar, it goes here */}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {/* Header - Stacked on mobile, row on md+ */}
        <header className="mb-6 md:mb-10 border-b border-matrix-green/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-matrix-green uppercase tracking-widest break-words">
              DevSec | Network Monitor
            </h1>
            <p className="text-gray-400 font-mono text-xs md:text-sm mt-1 uppercase">
              Location: {location} | Active Nodes: {devices.length}
            </p>
          </div>
          <div className="text-left md:text-right text-[10px] md:text-xs text-gray-500 font-mono mt-2 md:mt-0">
            V 1.0.4 | SECURE_OS
          </div>
        </header>

        {/* Risk Assessment Section */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-white text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
            Security Command Center
          </h2>
          {summary && <RiskGauge summary={summary} />}
        </section>

        {/* Stats Grid - 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
          <div className="bg-[#161b22] p-4 md:p-6 border-l-4 border-matrix-green shadow-lg hover:bg-[#1c2128] transition-colors rounded-r-lg">
            <h3 className="text-gray-400 uppercase text-[10px] md:text-xs tracking-wider">
              Total Devices
            </h3>
            <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">
              {devices.length}
            </p>
          </div>
          <div className="bg-[#161b22] p-4 md:p-6 border-l-4 border-red-500 shadow-lg hover:bg-[#1c2128] transition-colors rounded-r-lg">
            <h3 className="text-gray-400 uppercase text-[10px] md:text-xs tracking-wider">
              Active Alerts
            </h3>
            <p className="text-3xl md:text-4xl font-bold text-red-500 mt-1 md:mt-2">
              {alerts.filter((a) => !a.is_resolved).length}
            </p>
          </div>
          <div className="bg-[#161b22] p-4 md:p-6 border-l-4 border-blue-500 shadow-lg hover:bg-[#1c2128] transition-colors rounded-r-lg sm:col-span-2 lg:col-span-1">
            <h3 className="text-gray-400 uppercase text-[10px] md:text-xs tracking-wider">
              Network Health
            </h3>
            <p className="text-2xl md:text-4xl font-bold text-blue-400 mt-1 md:mt-2 truncate">
              {summary?.risk_level === "Low" ? "STABLE" : "VULNERABLE"}
            </p>
          </div>
        </div>

        {/* Main Asset Table */}
        <section className="bg-[#161b22] rounded-xl p-4 md:p-6 border border-gray-800 shadow-xl overflow-hidden w-full">
          <h2 className="text-lg md:text-xl mb-4 md:mb-6 text-matrix-green uppercase tracking-wider font-bold">
            Discovered Assets
          </h2>

          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto custom-scrollbar w-full">
            <div className="min-w-[600px] pb-2">
              <DeviceTable devices={devices} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
