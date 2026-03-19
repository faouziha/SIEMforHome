import React, { useContext, useState } from 'react';
import { SecurityContext } from '../context/SecurityContext';
import { Monitor, RefreshCcw, Wifi, Server } from 'lucide-react';
import DeviceTable from '../components/DeviceTable';

const DevicesPage = () => {
  const { devices, loading, refreshData } = useContext(SecurityContext);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const handleRefresh = async () => {
    try {
      await refreshData();
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Manual refresh failed:", err);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Monitor className="text-matrix-green shrink-0" /> 
            Network Inventory
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
            <p className="text-gray-500 text-xs md:text-sm flex items-center gap-1">
              <Server size={14} /> Managing {devices.length} network nodes
            </p>
            <span className="text-gray-700 text-[10px] md:text-xs font-mono hidden sm:inline-block">|</span>
            <span className="text-gray-700 text-[10px] md:text-xs font-mono mt-1 sm:mt-0">
              LAST_SYNC: {lastUpdated}
            </span>
          </div>
        </div>
        
        {/* Refresh Button - Full width on mobile */}
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className={`w-full md:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg border font-mono text-xs md:text-sm transition-all active:scale-95 shadow-lg ${
            loading 
              ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed" 
              : "bg-matrix-green/5 border-matrix-green/30 text-matrix-green hover:bg-matrix-green/20 hover:border-matrix-green/50"
          }`}
        >
          <RefreshCcw size={16} className={loading ? "animate-spin shrink-0" : "shrink-0"} /> 
          {loading ? "FETCHING..." : "REFRESH INVENTORY"}
        </button>
      </div>

      {/* Main Content Area - Added overflow-x-auto for mobile tables */}
      <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-x-auto shadow-2xl">
        {devices.length > 0 ? (
          <div className="min-w-[600px]"> {/* Ensures table doesn't squash too much on mobile */}
            <DeviceTable devices={devices} />
          </div>
        ) : (
          <div className="p-10 md:p-20 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-900 mb-4">
              <Wifi size={32} className="text-gray-700 animate-pulse md:w-10 md:h-10" />
            </div>
            <h3 className="text-gray-400 font-bold text-base md:text-lg">No Active Nodes Found</h3>
            <p className="text-gray-600 text-xs md:text-sm mt-2 max-w-xs mx-auto">
              System database is empty. Perform a full reconnaissance scan to populate the inventory.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center gap-2 text-[9px] md:text-[10px] text-gray-600 font-mono uppercase tracking-widest">
        <div className="w-2 h-2 rounded-full bg-matrix-green animate-pulse shrink-0"></div>
        Live Connection to PostgreSQL DB
      </div>
    </div>
  );
};

export default DevicesPage;