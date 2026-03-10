import React, { useContext } from 'react';
import { SecurityContext } from '../context/SecurityContext';
import { Monitor, RefreshCcw } from 'lucide-react';
import DeviceTable from '../components/DeviceTable'; // Using the component we built!

const DevicesPage = () => {
  const { devices, loading, refreshData } = useContext(SecurityContext);

  return (
    <div className="p-8 bg-[#0d1117]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Monitor /> 
            Network Inventory
          </h1>
          <p className="text-gray-500 text-sm">Managing {devices.length} network nodes</p>
        </div>
        
        <button 
          onClick={refreshData}
          className="flex items-center gap-2 bg-gray-800/50 hover:bg-matrix-green/20 text-matrix-green px-4 py-2 rounded-lg border border-matrix-green/30 transition-all active:scale-95"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> 
          {loading ? "Scanning..." : "Refresh Inventory"}
        </button>
      </div>

      {/* REUSED COMPONENT */}
      <DeviceTable devices={devices} />
    </div>
  );
};

export default DevicesPage;