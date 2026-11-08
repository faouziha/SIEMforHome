import React from 'react';
import { deviceTitle, isAutoNamed } from '../utils/deviceName';

const DeviceTable = ({ devices, onSelect }) => {
  return (
    <div className="overflow-x-auto bg-cyber-gray rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-black/40 text-matrix-green uppercase text-[11px] tracking-wider">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">IP Address</th>
            <th className="p-4">MAC Address</th>
            <th className="p-4">Vendor</th>
            <th className="p-4">Trust</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {devices.map((device) => (
            <tr
              key={device.mac_address}
              onClick={onSelect ? () => onSelect(device) : undefined}
              onKeyDown={onSelect ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(device)) : undefined}
              tabIndex={onSelect ? 0 : undefined}
              className={`hover:bg-white/[0.03] transition-colors text-sm ${onSelect ? "cursor-pointer focus:bg-white/[0.05] focus:outline-none" : ""}`}
            >
              <td className="p-4 font-mono text-blue-300">
                <span className={isAutoNamed(device) ? "text-blue-300/60" : ""} title={isAutoNamed(device) ? "Automatic name. Open the device to rename it" : undefined}>
                  {deviceTitle(device)}
                </span>
              </td>
              <td className="p-4 font-mono">{device.ip_address}</td>
              <td className="p-4 font-mono text-gray-400">{device.mac_address}</td>
              <td className="p-4 italic">{device.vendor || 'Generic Device'}</td>
              <td className="p-4">
                {device.is_whitelisted ? (
                  <span className="px-2 py-1 bg-matrix-green/10 text-matrix-green ring-1 ring-inset ring-matrix-green/30 text-xs rounded">Trusted</span>
                ) : (
                  <span className="px-2 py-1 bg-sev-high/10 text-sev-critical ring-1 ring-inset ring-sev-high/30 text-xs rounded">Unverified</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTable;