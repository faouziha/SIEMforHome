import React, { useState, useEffect, useContext } from "react";
import { SecurityContext } from "../context/SecurityContext";
import DeviceTable from "../components/DeviceTable";
import { DeviceDrawer } from "../components/DeviceCard";
// import Sidebar from "../components/Sidebar";
import RiskGauge from "../components/RiskGauge";
import { securityService } from "../services/api";
import { Link } from "react-router-dom";
import { ArrowRight, MonitorPlay, ShieldAlert, HeartPulse } from "lucide-react";
import { StackedTimeline, SeverityLegend } from "../components/charts";

const Dashboard = () => {
  const { devices, alerts, loading } = useContext(SecurityContext);
  const [summary, setSummary] = useState(null);
  const [location, setLocation] = useState("DETECTING_LOCATION...");
  const [trend, setTrend] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const selected = devices.find((d) => d.id === selectedId) || null;

  // 7-day alert trend for the mini history chart
  useEffect(() => {
    securityService
      .getAlertHistory(7)
      .then((r) => setTrend(r.data))
      .catch((e) => console.error("Failed to fetch alert trend", e));
  }, [alerts]);

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
      <div className="flex h-screen items-center justify-center">
        <div className="text-matrix-green text-lg md:text-xl font-mono animate-pulse px-4 text-center">
          [SYSTEM INITIALIZING...]
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen text-white overflow-hidden">
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
          <div className="card relative overflow-hidden p-4 md:p-6 animate-fade-up before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-matrix-green">
            <h3 className="flex items-center gap-2 text-gray-400 uppercase text-[10px] md:text-xs tracking-wider">
              <MonitorPlay size={14} /> Total Devices
            </h3>
            <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2">
              {devices.length}
            </p>
          </div>
          <div className="card relative overflow-hidden p-4 md:p-6 animate-fade-up before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-sev-high">
            <h3 className="flex items-center gap-2 text-gray-400 uppercase text-[10px] md:text-xs tracking-wider">
              <ShieldAlert size={14} /> Active Alerts
            </h3>
            <p className="text-3xl md:text-4xl font-bold text-sev-high mt-1 md:mt-2">
              {alerts.filter((a) => !a.is_resolved).length}
            </p>
          </div>
          <div className="card relative overflow-hidden p-4 md:p-6 animate-fade-up before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[#3987e5] sm:col-span-2 lg:col-span-1">
            <h3 className="flex items-center gap-2 text-gray-400 uppercase text-[10px] md:text-xs tracking-wider">
              <HeartPulse size={14} /> Network Health
            </h3>
            <p className="text-2xl md:text-4xl font-bold text-blue-400 mt-1 md:mt-2 truncate">
              {summary?.risk_level === "Low" ? "STABLE" : "VULNERABLE"}
            </p>
          </div>
        </div>

        {/* 7-day alert trend */}
        <section className="card p-4 md:p-6 mb-8 md:mb-10 animate-fade-up">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl text-matrix-green uppercase tracking-wider font-bold">Alert Trend</h2>
              <p className="text-xs text-gray-500 mt-1">
                {trend ? `${trend.totals.total} alerts in the last 7 days` : "Loading last 7 days…"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SeverityLegend />
              <Link to="/view/history" className="flex items-center gap-1 text-xs text-matrix-green hover:underline">
                Full history <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          {trend && <StackedTimeline data={trend.timeline} granularity={trend.granularity} height={180} />}
        </section>

        {/* Main Asset Table */}
        <section className="card p-4 md:p-6 overflow-hidden w-full">
          <h2 className="text-lg md:text-xl mb-4 md:mb-6 text-matrix-green uppercase tracking-wider font-bold">
            Discovered Assets
          </h2>

          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto custom-scrollbar w-full">
            <div className="min-w-[600px] pb-2">
              <DeviceTable devices={devices} onSelect={(d) => setSelectedId(d.id)} />
            </div>
          </div>
        </section>
      </main>
      <DeviceDrawer device={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
};

export default Dashboard;
