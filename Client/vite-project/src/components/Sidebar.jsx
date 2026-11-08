import React, { useContext, useState } from "react";
import { SecurityContext } from "../context/SecurityContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  MonitorPlay,
  Settings,
  Terminal,
  Menu,
  X,
  Network,
  History,
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { alerts, devices } = useContext(SecurityContext);
  const openAlerts = alerts.filter((a) => !a.is_resolved).length;

  const menuItems = [
    {
      name: "Dashboard",
      path: "/view/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Devices", path: "/view/devices", icon: <MonitorPlay size={20} /> },
    { name: "Alerts", path: "/view/alerts", icon: <ShieldAlert size={20} /> },
    { name: "History", path: "/view/history", icon: <History size={20} /> },
    { name: "Scan", path: "/view/scans", icon: <Terminal size={20} /> },
    { name: "Topology", path: "/view/topology", icon: <Network size={20} /> },
    { name: "Settings", path: "/view/settings", icon: <Settings size={20} /> }, 
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-cyber-gray border border-cyber-line rounded-md text-matrix-green"
        onClick={toggleSidebar}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>

      {/* Sidebar Container */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-cyber-black/95 backdrop-blur border-r border-cyber-line flex flex-col p-4
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 mb-10 mt-12 lg:mt-0">
          <div className="w-8 h-8 bg-matrix-green rounded-lg flex items-center justify-center text-black text-sm font-extrabold shadow-[0_0_18px_rgba(61,220,132,0.35)]">
            DS
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">
            DEVSEC
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)} // Close on mobile after click
              className={({ isActive }) => `
                w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? "bg-matrix-green/10 text-matrix-green ring-1 ring-inset ring-matrix-green/20"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Live alert status (real data, replaces the hard-coded load bar) */}
        <div className="mt-auto p-4 bg-cyber-gray/60 rounded-xl border border-cyber-line backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${openAlerts ? "bg-sev-high" : "bg-matrix-green"}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${openAlerts ? "bg-sev-high" : "bg-matrix-green"}`} />
            </span>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
              {openAlerts ? "Issues open" : "All clear"}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-mono text-white">{openAlerts}</span> open alert{openAlerts === 1 ? "" : "s"} ·{" "}
            <span className="font-mono text-white">{devices.length}</span> devices
          </p>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
