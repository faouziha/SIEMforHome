import React, { useState, useContext } from "react";
import { Terminal, Play, Loader2 } from "lucide-react";
import { SecurityContext } from "../context/SecurityContext";
import { securityService } from "../services/api";

const ScansPage = () => {
  const { refreshData } = useContext(SecurityContext);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLog, setScanLog] = useState([
    { id: 1, msg: "System ready for instruction...", type: "info" },
  ]);

  // We use a timestamp + index to ensure unique IDs for rapid logs
  const addToLog = (msg, type = "info") => {
    setScanLog((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), msg, type },
    ]);
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    // Clear logs for a fresh session or keep them as you prefer
    setScanLog([
      { id: Date.now(), msg: "--- INITIALIZING NMAP ENGINE ---", type: "info" },
    ]);

    try {
      const response = await securityService.runNetworkScan();

      if (response.data && response.data.raw_output) {
        const lines = response.data.raw_output.split("\n");

        lines.forEach((line) => {
          if (line.trim()) {
            let type = "info";
            // Highlight ports and successful syncs
            if (line.includes("[+]") || line.includes("✅")) type = "success";
            if (
              line.includes("⚠️") ||
              line.includes("Error") ||
              line.includes("❌")
            )
              type = "error";

            addToLog(line, type);
          }
        });
      }

      addToLog("DATABASE SYNCHRONIZATION COMPLETE", "success");
      await refreshData();
    } catch (error) {
      console.error("Scan Error:", error);
      addToLog(
        "CRITICAL ERROR: Connection to scanning engine timed out.",
        "error",
      );
    } finally {
      setIsScanning(false);
    }
  };

  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scanLog]);
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Terminal />
            Vulnerability Scanner
          </h1>
          <p className="text-gray-500 text-sm">
            Active reconnaissance mode: Service & Version Detection
          </p>
        </div>

        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            isScanning
              ? "bg-gray-800 text-green-400 cursor-not-allowed border border-gray-700"
              : "bg-matrix-green/10 text-matrix-green border border-matrix-green/50 hover:bg-matrix-green hover:text-green-400 active:scale-95"
          }`}
        >
          {isScanning ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Play size={20} />
          )}
          {isScanning ? "ENGINE BUSY..." : "RUN FULL RECON"}
        </button>
      </div>

      <div className="bg-[#0a0c10] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-matrix-green/20 border border-matrix-green/50"></div>
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">
            nmap_v7.94_recon.sh
          </span>
        </div>

        {/* Console Body */}
        <div ref={scrollRef} className="p-6 h-[500px] overflow-y-auto font-mono text-sm space-y-1">
          {scanLog.map((log) => (
            <div
              key={log.id}
              className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <span className="text-gray-600 shrink-0">
                [{new Date(log.id).toLocaleTimeString([], { hour12: false })}]
              </span>
              <span
                className={`shrink-0 ${
                  log.type === "success"
                    ? "text-matrix-green"
                    : log.type === "error"
                      ? "text-red-500"
                      : "text-blue-400"
                }`}
              >
                {log.type === "success"
                  ? "✔"
                  : log.type === "error"
                    ? "✘"
                    : "λ"}
              </span>
              <span
                className={`break-all ${log.type === "success" ? "text-gray-200" : "text-gray-400"}`}
              >
                {log.msg}
              </span>
            </div>
          ))}

          {isScanning && (
            <div className="flex gap-3 animate-pulse mt-2">
              <span className="text-matrix-green">_</span>
              <span className="text-matrix-green text-xs italic">
                Awaiting Nmap response...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScansPage;
