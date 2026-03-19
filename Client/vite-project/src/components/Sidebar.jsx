import React, { useState } from "react";
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
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/view/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Devices", path: "/view/devices", icon: <MonitorPlay size={20} /> },
    { name: "Alerts", path: "/view/alerts", icon: <ShieldAlert size={20} /> },
    { name: "Scan", path: "/view/scans", icon: <Terminal size={20} /> },
    { name: "Topology", path: "/view/topology", icon: <Network size={20} /> },
    { name: "Settings", path: "/view/settings", icon: <Settings size={20} /> }, 
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-cyber-gray border border-gray-700 rounded-md text-matrix-green"
        onClick={toggleSidebar}
      >
        {isOpen ? (
          <X className="text-green-400" size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>

      {/* Sidebar Container */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-[#0d1117] border-r border-gray-800 flex flex-col p-4
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 mb-10 mt-12 lg:mt-0">
          <div className="w-8 h-8 bg-matrix-green text-green-400 rounded flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(0,255,65,0.3)]">
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
                    ? "bg-matrix-green/10 text-green-400 border-l-4 border-matrix-green shadow-[inset_4px_0_10px_rgba(0,255,65,0.05)]"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* System Load Footer */}
        <div className="mt-auto p-4 bg-cyber-gray/50 rounded-xl border border-gray-800/50 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
              System Load
            </p>
            <span className="text-[10px] text-matrix-green font-mono">32%</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-matrix-green h-full transition-all duration-1000 shadow-[0_0_8px_#00ff41]"
              style={{ width: "32%" }}
            ></div>
          </div>
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
