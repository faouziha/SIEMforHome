import React, { useContext } from 'react';
import { SecurityContext } from '../context/SecurityContext';
import { ShieldAlert, Clock, Info } from 'lucide-react';

const AlertsPage = () => {
  const { alerts } = useContext(SecurityContext);

  const getSeverityStyle = (sev) => {
    if (sev === 'High') return 'border-red-500/50 bg-red-500/10 text-red-400';
    if (sev === 'Medium') return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
    return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
  };

  return (
    <div className="p-8 bg-[#0d1117]">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
        <ShieldAlert className="text-red-500" /> Security Intelligence
      </h1>

      <div className="grid gap-4">
        {alerts.length > 0 ? alerts.map((alert) => (
          <div key={alert.id} className={`p-5 border-l-4 rounded-r-xl flex justify-between items-center transition-all hover:translate-x-1 ${getSeverityStyle(alert.severity)}`}>
            <div className="flex gap-4">
              <div className="p-2 bg-black/20 rounded-lg"><Info size={20} /></div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">{alert.alert_type}</p>
                <h3 className="font-semibold text-lg">{alert.description}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs font-mono opacity-50">
                  <Clock size={12} /> {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <span className="text-xs font-black uppercase px-3 py-1 rounded border border-current">
              {alert.severity}
            </span>
          </div>
        )) : (
          <div className="text-center py-20 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500 font-mono">NO ACTIVE THREATS DETECTED</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;