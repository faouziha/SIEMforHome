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
    <div className="p-8 bg-[#0d1117] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Monitor className="text-matrix-green" /> 
            Network Inventory
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <Server size={14} /> Managing {devices.length} network nodes
            </p>
            <span className="text-gray-700 text-xs font-mono">
              LAST_SYNC: {lastUpdated}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-mono text-sm transition-all active:scale-95 shadow-lg ${
            loading 
              ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed" 
              : "bg-matrix-green/5 border-matrix-green/30 text-matrix-green hover:bg-matrix-green/20 hover:border-matrix-green/50"
          }`}
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> 
          {loading ? "FETCHING..." : "REFRESH INVENTORY"}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden">
        {devices.length > 0 ? (
          <DeviceTable devices={devices} />
        ) : (
          <div className="p-20 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-900 mb-4">
              <Wifi size={40} className="text-gray-700 animate-pulse" />
            </div>
            <h3 className="text-gray-400 font-bold text-lg">No Active Nodes Found</h3>
            <p className="text-gray-600 text-sm mt-1 max-w-xs mx-auto">
              System database is empty. Perform a full reconnaissance scan to populate the inventory.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
        <div className="w-2 h-2 rounded-full bg-matrix-green animate-pulse"></div>
        Live Connection to PostgreSQL DB
      </div>
    </div>
  );
};

export default DevicesPage;