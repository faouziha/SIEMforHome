import React, { useState, useEffect } from 'react';
import { Settings, Save, Search, ShieldCheck, AlertTriangle, Terminal, CheckCircle2 } from 'lucide-react';
import { securityService } from '../services/api';

const SettingsPage = () => {
  const [config, setConfig] = useState({
    tshark_path: '',
    auto_detected: '',
    interfaces: [],
    is_admin: false
  });
  const [loading, setLoading] = useState(true);
  // NEW: State for the custom notification
  const [statusMsg, setStatusMsg] = useState({ show: false, text: '', type: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await securityService.getSettings();
      setConfig(res.data);
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  const showNotification = (text, type = 'success') => {
    setStatusMsg({ show: true, text, type });
    // Auto-hide after 3 seconds
    setTimeout(() => setStatusMsg({ show: false, text: '', type: '' }), 3000);
  };

  const handleSave = async () => {
    try {
      await securityService.updateSettings({ tshark_path: config.tshark_path });
      showNotification("SYSTEM_CONFIG_UPDATED", "success");
    } catch (err) {
      showNotification("SAVE_FAILED_CHECK_LOGS", "error");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-screen text-white relative">
      
      {/* --- FLOATING NOTIFICATION --- */}
      {statusMsg.show && (
        <div className={`fixed top-10 right-10 flex items-center gap-3 px-6 py-3 rounded-lg border shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 duration-300 z-50 ${
          statusMsg.type === 'success' 
            ? "bg-matrix-green/10 border-matrix-green text-matrix-green" 
            : "bg-red-500/10 border-red-500 text-red-500"
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-mono font-bold tracking-tighter">{statusMsg.text}</span>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <Settings className="text-matrix-green" /> System Configuration
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Path Configuration */}
        <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 space-y-6">
          <h2 className="text-lg font-semibold border-b border-gray-800 pb-2 flex items-center gap-2">
            <Terminal size={20} className="text-blue-400" /> Engine Paths
          </h2>
          
          <div>
            <label className="text-xs font-mono text-gray-500 uppercase">TShark Binary Path</label>
            <div className="flex gap-2 mt-2">
              <input 
                type="text"
                className="flex-1 bg-black/30 border border-gray-700 rounded-lg p-2 text-sm font-mono focus:border-matrix-green outline-none"
                value={config.tshark_path}
                onChange={(e) => setConfig({...config, tshark_path: e.target.value})}
                placeholder="e.g. C:\Program Files\Wireshark\tshark.exe"
              />
              <button 
                onClick={() => {
                    setConfig({...config, tshark_path: config.auto_detected});
                    showNotification("PATH_AUTO_LOADED", "success");
                }}
                className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                title="Auto-detect"
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-matrix-green text-black font-bold py-2 rounded-lg hover:bg-green-400 transition-all active:scale-95"
          >
            <Save size={18} /> SAVE CONFIGURATION
          </button>
        </div>

        {/* Environment Status */}
        <div className="space-y-6">
          <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
               System Health
            </h2>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                config.is_admin ? "bg-matrix-green/5 border-matrix-green/20" : "bg-red-500/5 border-red-500/20"
              }`}>
                <span className="text-sm text-gray-400">Admin Privileges</span>
                {config.is_admin ? 
                  <ShieldCheck className="text-matrix-green" /> : 
                  <div className="flex items-center gap-2 text-red-500 font-mono text-[10px]">
                    <AlertTriangle size={16} /> REQUIRED
                  </div>
                }
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg border border-gray-800">
                <span className="text-sm text-gray-400 block mb-2">Network Adapter Interface</span>
                <select className="w-full bg-[#0d1117] border border-gray-700 rounded p-2 text-xs text-gray-300 outline-none focus:border-matrix-green">
                  {config.interfaces.map((intf, idx) => (
                    <option key={idx} value={idx + 1}>{intf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;