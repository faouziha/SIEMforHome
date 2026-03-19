import React, { useContext, useState } from "react";
import { SecurityContext } from "../context/SecurityContext";
import {
  ShieldAlert,
  Clock,
  Info,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import { securityService } from "../services/api";

const AlertsPage = () => {
  const { alerts, refreshData } = useContext(SecurityContext);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleResolve = async (id) => {
    try {
      await securityService.resolveAlert(id);
      if (refreshData) await refreshData();
    } catch (err) {
      console.error("Resolve failed", err);
    }
  };

  const filteredAlerts = alerts
    .filter((alert) => !alert.is_resolved)
    .filter(
      (alert) => severityFilter === "All" || alert.severity === severityFilter,
    )
    .filter(
      (alert) =>
        alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const getSeverityStyle = (sev) => {
    if (sev === "High") return "border-red-500/50 bg-red-500/10 text-red-400";
    if (sev === "Medium")
      return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    return "border-blue-500/50 bg-blue-500/10 text-blue-400";
  };

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-screen">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={24} />
          <span className="hidden sm:inline">Security Intelligence</span>
          <span className="sm:hidden text-lg">Alerts</span>
        </h1>
        <div className="text-[10px] text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded border border-gray-800">
          ACTIVE: {filteredAlerts.length}
        </div>
      </div>

      {/* --- RESPONSIVE FILTER BAR --- */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-[#161b22] p-3 md:p-4 rounded-xl border border-gray-800">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search threats..."
            className="w-full bg-black/30 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-matrix-green"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-black/30 border border-gray-700 rounded-lg px-3 py-1 flex-1 lg:flex-none">
            <Filter size={16} className="text-gray-500" />
            <select
              className="bg-transparent"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              {/* Explicitly styling the options to prevent white background */}
              <option value="All" className="bg-[#161b22] text-white">
                All Levels
              </option>
              <option value="High" className="bg-[#161b22] text-white">
                High
              </option>
              <option value="Medium" className="bg-[#161b22] text-white">
                Medium
              </option>
              <option value="Low" className="bg-[#161b22] text-white">
                Low
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* --- RESPONSIVE ALERTS LIST --- */}
      <div className="grid gap-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 md:p-5 border-l-4 rounded-r-xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all hover:bg-white/5 group ${getSeverityStyle(alert.severity)}`}
            >
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-black/20 rounded-lg shrink-0">
                  <Info size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                    {alert.alert_type}
                  </p>
                  <h3 className="font-semibold text-sm md:text-base text-white leading-tight">
                    {alert.description}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] md:text-xs font-mono opacity-50">
                    <Clock size={10} />{" "}
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Severity and Action wrapper */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t border-white/5 sm:border-none">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border border-current">
                  {alert.severity}
                </span>
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-matrix-green hover:text-black transition-all rounded-lg text-xs font-bold"
                >
                  <CheckCircle size={16} />
                  <span className="sm:hidden">RESOLVE</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-gray-900/10 border-2 border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500 font-mono text-xs tracking-widest uppercase px-4">
              {searchQuery || severityFilter !== "All"
                ? "No matches in sector"
                : "Perimeter Clear"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
