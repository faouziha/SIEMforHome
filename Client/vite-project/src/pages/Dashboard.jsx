import React, { useContext } from "react";
import { SecurityContext } from "../context/SecurityContext";
import DeviceTable from "../components/DeviceTable";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  const { devices, alerts, loading } = useContext(SecurityContext);

  if (loading)
    return (
      <div className="text-matrix-green p-10">Initializing Systems...</div>
    );

  return (
    <div className="flex min-h-screen bg-[#0d1117]">

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="min-h-screen text-white p-8">
          <header className="mb-10 border-b border-matrix-green pb-4">
            <h1 className="text-3xl font-bold text-matrix-green uppercase tracking-widest">
              DevSec | Network Monitor
            </h1>
            <p className="text-gray-400">
              Location: Fes, Morocco | Active Nodes: {devices.length}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-cyber-gray p-6 border-l-4 border-matrix-green shadow-lg">
              <h3 className="text-gray-400 uppercase text-sm">Total Devices</h3>
              <p className="text-4xl font-bold">{devices.length}</p>
            </div>
            <div className="bg-cyber-gray p-6 border-l-4 border-alert-red shadow-lg">
              <h3 className="text-gray-400 uppercase text-sm">
                Security Alerts
              </h3>
              <p className="text-4xl font-bold text-alert-red">
                {alerts.length}
              </p>
            </div>
            <div className="bg-cyber-gray p-6 border-l-4 border-blue-500 shadow-lg">
              <h3 className="text-gray-400 uppercase text-sm">
                Network Status
              </h3>
              <p className="text-4xl font-bold text-blue-400">SECURE</p>
            </div>
          </div>

          <section>
            <h2 className="text-xl mb-4 text-matrix-green uppercase tracking-wider">
              Discovered Assets
            </h2>
            <DeviceTable devices={devices} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
