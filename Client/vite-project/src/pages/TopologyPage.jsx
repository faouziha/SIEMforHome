import React, { useContext, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, Zap } from 'lucide-react';
import DeviceCard, { DeviceDrawer } from '../components/DeviceCard';
import { SecurityContext } from '../context/SecurityContext';
import { deviceTitle, deviceSubtitle } from '../utils/deviceName';

// Label geometry, in graph units (labels scale with zoom, so the collision
// boxes below stay true at any zoom level).
const NAME_FONT = 12;
const SUB_FONT = 10;
const CHAR_W = 0.6; // JetBrains Mono advance width, in em
const NAME_Y = 14;
const SUB_Y = 27;
const nodeRadius = (node) => (node.type === 'gateway' ? 7 : 5);

// Half-width / extent of the dot + labels block, used for hit-testing and collision.
const nodeBox = (node) => {
  const textW = Math.max(node.name.length * CHAR_W * NAME_FONT, (node.sub || '').length * CHAR_W * SUB_FONT);
  const top = -nodeRadius(node) - 2;
  const bottom = (node.sub ? SUB_Y + SUB_FONT / 2 : NAME_Y + NAME_FONT / 2) + 2;
  return { hw: Math.max(nodeRadius(node) + 2, textW / 2 + 3), top, bottom };
};

// Draw the node: dot, name, and a dimmer second line (IP or vendor).
const paintNode = (node, ctx) => {
  if (node.hot) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'red';
  }
  ctx.beginPath();
  ctx.arc(node.x, node.y, nodeRadius(node), 0, 2 * Math.PI, false);
  ctx.fillStyle = node.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${NAME_FONT}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(230, 237, 243, 0.92)';
  ctx.fillText(node.name, node.x, node.y + NAME_Y);
  if (node.sub) {
    ctx.font = `${SUB_FONT}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(139, 148, 158, 0.9)';
    ctx.fillText(node.sub, node.x, node.y + SUB_Y);
  }
};

// Hover hit-area = the dot + label block that is actually drawn.
// (The library default is an invisible ~23px circle that ignores the labels.)
const paintNodeHitArea = (node, color, ctx) => {
  const b = nodeBox(node);
  ctx.fillStyle = color;
  ctx.fillRect(node.x - b.hw, node.y + b.top, b.hw * 2, b.bottom - b.top);
};

// Custom d3 force: pushes nodes apart until their dot+label boxes stop overlapping.
const labelCollide = () => {
  let nodes = [];
  const GAP = 6;
  const force = () => {
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const ba = a.__box, bb = b.__box;
          const dx = (b.x + b.vx) - (a.x + a.vx);
          const dy = (b.y + b.vy + (bb.top + bb.bottom) / 2) - (a.y + a.vy + (ba.top + ba.bottom) / 2);
          const ox = ba.hw + bb.hw + GAP - Math.abs(dx);
          const oy = (ba.bottom - ba.top + bb.bottom - bb.top) / 2 + GAP - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          // Resolve along the axis with the least overlap; fixed nodes don't move.
          const wa = a.fx != null ? 0 : b.fx != null ? 1 : 0.5;
          const wb = 1 - wa;
          if (ox < oy) {
            const s = (dx < 0 ? -1 : 1) * ox * 0.5;
            a.vx -= s * wa; b.vx += s * wb;
          } else {
            const s = (dy < 0 ? -1 : 1) * oy * 0.5;
            a.vy -= s * wa; b.vy += s * wb;
          }
        }
      }
    }
  };
  force.initialize = (n) => {
    nodes = n;
    nodes.forEach((d) => { d.__box = nodeBox(d); });
  };
  return force;
};

const noLinkHitArea = () => {}; // links are not interactive; never let them steal hover
const linkColor = () => '#334155';
const emptyLabel = () => '';
const CARD_W = 340;
const CARD_H = 340;

const TopologyPage = () => {
  const { devices, alerts } = useContext(SecurityContext);
  const fgRef = useRef();
  const boxRef = useRef();
  const [hovered, setHovered] = useState(null);
  const pointerRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const cardRef = useRef(null);
  const [pinnedId, setPinnedId] = useState(null);
  const pinned = devices.find((d) => d.id === pinnedId) || null;
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Position the hover card straight on the DOM node, so moving the mouse does
  // not re-render the page (and re-send props to the graph) on every pixel.
  const placeCard = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const { x, y, w, h } = pointerRef.current;
    const flipX = x > w - CARD_W;
    const flipY = y > h - CARD_H;
    el.style.left = flipX ? '' : `${x + 16}px`;
    el.style.right = flipX ? `${w - x + 16}px` : '';
    el.style.top = flipY ? '' : `${y + 16}px`;
    el.style.bottom = flipY ? `${Math.max(8, h - y + 16)}px` : '';
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHovered(node || null);
    if (boxRef.current) boxRef.current.style.cursor = node?.device ? 'pointer' : '';
  }, []);
  const handleNodeClick = useCallback((node) => node.device && setPinnedId(node.device.id), []);

  // Size the canvas to its container (it defaults to the full window otherwise)
  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  // Only rebuild the graph (and restart the layout) when the topology or a
  // node colour actually changes, not on every 30s data refresh.
  const signature = devices
    .map((d) => {
      const hot = alerts.some((a) => a.related_device === d.id && !a.is_resolved && ['High', 'Critical'].includes(a.severity));
      return `${d.id}:${deviceTitle(d)}:${deviceSubtitle(d)}:${hot ? 1 : 0}`;
    })
    .join('|');

  // Layout: a ring sized to fit every label, plus label-aware collision,
  // then zoom to fit once the layout settles.
  const fittedRef = useRef(false);
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const ring = Math.max(150, (devices.length * 105) / (2 * Math.PI));
    fg.d3Force('charge').strength(-300);
    fg.d3Force('link').distance(ring).strength(0.6);
    fg.d3Force('collide', labelCollide());
    fittedRef.current = false;
    fg.d3ReheatSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  const handleEngineStop = useCallback(() => {
    if (!fittedRef.current && fgRef.current) {
      fittedRef.current = true;
      fgRef.current.zoomToFit(500, 40);
    }
  }, []);

  const graphData = useMemo(() => {
    // Gateway pinned at the centre so the ring stays balanced around it
    const nodes = [{ id: 'gateway', name: 'Gateway', sub: '192.168.100.1', val: 12, color: '#3ddc84', type: 'gateway', fx: 0, fy: 0 }];
    const links = [];

    devices.forEach(device => {
      const deviceAlerts = alerts.filter(a => a.related_device === device.id && !a.is_resolved);
      const hasHighAlert = deviceAlerts.some(a => ['High', 'Critical'].includes(a.severity));
      
      nodes.push({
        id: device.id,
        name: deviceTitle(device),
        sub: deviceSubtitle(device),
        val: 8,
        color: hasHighAlert ? '#ff3131' : '#60a5fa',
        hot: hasHighAlert,
        type: 'device',
        device,
      });

      links.push({ source: 'gateway', target: device.id });
    });

    return { nodes, links };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div className="p-4 md:p-8 min-h-screen text-white relative font-sans">
      
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
      <div
        ref={boxRef}
        className="relative bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl h-[70vh] w-full"
        onMouseMove={(e) => {
          const r = boxRef.current.getBoundingClientRect();
          pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
          placeCard();
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={size.width}
          height={size.height}
          nodeRelSize={8}
          nodeLabel={emptyLabel}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintNodeHitArea}
          linkPointerAreaPaint={noLinkHitArea}
          onEngineStop={handleEngineStop}
          cooldownTime={5000}
          linkColor={linkColor}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={2}
          backgroundColor="#161b22"
        />

        {/* Hover card: follows the pointer, flips away from the edges */}
        {hovered && (
          <div
            ref={(el) => { cardRef.current = el; placeCard(); }}
            className="pointer-events-none absolute z-10 w-80 max-w-[85%] rounded-[0.875rem] bg-cyber-gray shadow-2xl shadow-black/60"
          >
            {hovered.device ? (
              <DeviceCard device={devices.find((d) => d.id === hovered.id) || hovered.device} compact />
            ) : (
              <div className="card p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Gateway</p>
                <p className="mt-1 font-mono text-sm text-white">{hovered.sub}</p>
                <p className="mt-1 text-xs text-gray-400">{devices.length} connected devices</p>
              </div>
            )}
          </div>
        )}
        <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-gray-500">Hover a node for details · click to pin</p>
      </div>
      <DeviceDrawer device={pinned} onClose={() => setPinnedId(null)} />
    </div>
  );
};

export default TopologyPage;