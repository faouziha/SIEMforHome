import React from 'react';

const DeviceTable = ({ devices }) => {
  return (
    <div className="overflow-x-auto bg-cyber-gray rounded-lg border border-gray-800">
      <table className="w-full text-left">
        <thead className="bg-black text-matrix-green uppercase text-xs">
          <tr>
            <th className="p-4">Hostname</th>
            <th className="p-4">IP Address</th>
            <th className="p-4">MAC Address</th>
            <th className="p-4">Vendor</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {devices.map((device) => (
            <tr key={device.mac_address} className="hover:bg-gray-900 transition-colors">
              <td className="p-4 font-mono text-blue-300">{device.hostname}</td>
              <td className="p-4 font-mono">{device.ip_address}</td>
              <td className="p-4 font-mono text-gray-400">{device.mac_address}</td>
              <td className="p-4 italic">{device.vendor || 'Generic Device'}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">Online</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTable;