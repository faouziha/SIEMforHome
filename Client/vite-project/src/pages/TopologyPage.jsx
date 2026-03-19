import React, { useContext, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { SecurityContext } from '../context/SecurityContext';
import { Network, Zap } from 'lucide-react';

const TopologyPage = () => {
  const { devices, alerts } = useContext(SecurityContext);
  const fgRef = useRef();

  // Optimized physics to spread nodes out smoothly
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-450); 
      fgRef.current.d3Force('link').distance(160);    
    }
  }, [devices]);

  const graphData = useMemo(() => {
    const nodes = [{ id: 'gateway', name: '192.168.100.1', val: 12, color: '#00ff41', type: 'gateway' }];
    const links = [];

    devices.forEach(device => {
      const deviceAlerts = alerts.filter(a => a.related_device === device.id && !a.is_resolved);
      const hasHighAlert = deviceAlerts.some(a => a.severity === 'High');
      
      nodes.push({
        id: device.id,
        name: device.hostname || device.ip_address,
        val: 8,
        color: hasHighAlert ? '#ff3131' : '#60a5fa',
        type: 'device'
      });

      links.push({ source: 'gateway', target: device.id });
    });

    return { nodes, links };
  }, [devices, alerts]);

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-screen text-white relative font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
          <Network className="text-matrix-green" /> 
          Network Topology Map
        </h1>
        <div className="flex items-center gap-2 text-[10px] font-mono text-matrix-green bg-matrix-green/5 px-2 py-1 rounded border border-matrix-green/20">
           <Zap size={12} className="animate-pulse" /> LIVE_TOPOLOGY_DATA
        </div>
      </div>

      {/* THE GRAPH CONTAINER */}
      <div className="relative bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl h-[70vh] w-full">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeRelSize={8}
          
          // --- CUSTOM GRAPHICS ---
          nodeLabel={node => node.name}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
            
            // Glow effect for Vulnerable nodes
            if (node.color === '#ff3131') {
              ctx.shadowBlur = 15;
              ctx.shadowColor = 'red';
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.type === 'gateway' ? 7 : 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset shadow for text

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + 14);
          }}

          linkColor={() => '#334155'}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={2}
          backgroundColor="#161b22"
        />
      </div>
    </div>
  );
};

export default TopologyPage;