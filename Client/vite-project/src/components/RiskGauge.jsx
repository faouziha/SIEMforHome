import React from 'react';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

const RiskGauge = ({ summary }) => {
  const { score, risk_level, counts } = summary;

  const getColor = () => {
    if (score > 70) return "text-red-500 border-red-500/30 bg-red-500/10";
    if (score > 40) return "text-orange-500 border-orange-500/30 bg-orange-500/10";
    if (score > 15) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
    return "text-matrix-green border-matrix-green/30 bg-matrix-green/10";
  };

  return (
    <div className={`p-6 rounded-xl border ${getColor()} transition-all duration-500`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-mono uppercase tracking-widest opacity-70">Network Risk Level</h3>
          <p className="text-3xl font-bold mt-1 tracking-tighter">{risk_level.toUpperCase()}</p>
        </div>
        {score > 40 ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
      </div>

      {/* The Visual Progress Bar */}
      <div className="w-full bg-gray-800/50 h-3 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-current transition-all duration-1000 ease-out" 
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-black/20 p-2 rounded">
          <span className="block opacity-50">CRITICAL THREATS</span>
          <span className="text-lg font-bold">{counts.high}</span>
        </div>
        <div className="bg-black/20 p-2 rounded">
          <span className="block opacity-50">ACTIVE ALERTS</span>
          <span className="text-lg font-bold">{counts.total}</span>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;