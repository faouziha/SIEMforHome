import React, { useState } from "react";
import { useElementWidth, formatBucket } from "../utils/chartUtils";
import { SEVERITIES, SEVERITY_COLOR } from "../utils/severity";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const niceMax = (v) => {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

// Rect with only the top corners rounded (data end), anchored to the baseline.
const topRoundedRect = (x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
};

const total = (b) => SEVERITIES.reduce((s, k) => s + (b[k] || 0), 0);

/* ------------------------------------------------------------------ */
/* Tooltip + legend                                                    */
/* ------------------------------------------------------------------ */

export const ChartTooltip = ({ tip, containerWidth }) => {
  if (!tip) return null;
  const flip = tip.x > containerWidth - 190;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[150px] rounded-lg border border-white/10 bg-[#0d1117]/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
      style={{
        left: flip ? undefined : tip.x + 14,
        right: flip ? containerWidth - tip.x + 14 : undefined,
        top: Math.max(0, tip.y - 10),
      }}
    >
      {tip.content}
    </div>
  );
};

// Tooltip row: value leads (strong), label follows (secondary), short line key.
export const TipRow = ({ color, label, value }) => (
  <div className="flex items-center gap-2 py-0.5">
    {color && <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />}
    <span className="font-semibold tabular-nums text-white">{value}</span>
    <span className="text-gray-400">{label}</span>
  </div>
);

export const SeverityLegend = () => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400" aria-label="Severity legend">
    {SEVERITIES.map((s) => (
      <li key={s} className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SEVERITY_COLOR[s] }} />
        {s}
      </li>
    ))}
  </ul>
);

/* ------------------------------------------------------------------ */
/* Stacked severity timeline                                           */
/* ------------------------------------------------------------------ */

export const StackedTimeline = ({ data, granularity, height = 240 }) => {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const m = { top: 12, right: 8, bottom: 26, left: 34 };
  const iw = Math.max(0, width - m.left - m.right);
  const ih = height - m.top - m.bottom;
  const max = niceMax(Math.max(1, ...data.map(total)));
  const n = data.length || 1;
  const step = iw / n;
  const gap = step > 6 ? 2 : step > 3 ? 1 : 0;
  const bw = Math.max(1, step - gap);
  const y = (v) => (v / max) * ih;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Alerts over time, stacked by severity">
          <g transform={`translate(${m.left},${m.top})`}>
            {ticks.map((t) => (
              <g key={t} transform={`translate(0,${ih - y(t)})`}>
                <line x1={0} x2={iw} stroke={t === 0 ? "var(--chart-axis)" : "var(--chart-grid)"} />
                <text x={-8} dy="0.32em" textAnchor="end" className="tabular-nums" fontSize="11" fill="var(--chart-muted)">
                  {Number.isInteger(t) ? t : t.toFixed(1)}
                </text>
              </g>
            ))}

            {data.map((b, i) => {
              const x = i * step + gap / 2;
              let acc = 0;
              const segs = SEVERITIES.filter((s) => b[s] > 0);
              return (
                <g key={b.bucket}>
                  {hover?.i === i && <rect x={i * step} y={0} width={step} height={ih} fill="rgba(255,255,255,0.04)" />}
                  {segs.map((s, si) => {
                    const h = y(b[s]);
                    const yTop = ih - acc - h;
                    acc += h;
                    const isTop = si === segs.length - 1;
                    // 2px surface gap between stacked segments
                    const hh = Math.max(1, si > 0 && h > 3 ? h - 2 : h);
                    return isTop ? (
                      <path key={s} d={topRoundedRect(x, yTop, bw, hh, 4)} fill={SEVERITY_COLOR[s]} />
                    ) : (
                      <rect key={s} x={x} y={yTop + (h - hh)} width={bw} height={hh} fill={SEVERITY_COLOR[s]} />
                    );
                  })}
                  {/* Hit target: the full column, much larger than the bar */}
                  <rect
                    x={i * step}
                    y={0}
                    width={step}
                    height={ih}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${formatBucket(b.bucket, granularity, true)}: ${total(b)} alerts`}
                    onMouseMove={(e) => {
                      const r = ref.current.getBoundingClientRect();
                      setHover({ i, x: e.clientX - r.left, y: e.clientY - r.top });
                    }}
                    onFocus={() => setHover({ i, x: m.left + i * step + step / 2, y: m.top + 10 })}
                    onBlur={() => setHover(null)}
                    style={{ outline: "none" }}
                  />
                  {i % labelEvery === 0 && (
                    <text x={i * step + step / 2} y={ih + 18} textAnchor="middle" fontSize="11" fill="var(--chart-muted)">
                      {formatBucket(b.bucket, granularity)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
      <ChartTooltip
        containerWidth={width}
        tip={
          hover && data[hover.i] && {
            x: hover.x,
            y: hover.y,
            content: (
              <>
                <div className="mb-1 text-[11px] text-gray-400">{formatBucket(data[hover.i].bucket, granularity, true)}</div>
                {[...SEVERITIES].reverse().map((s) => (
                  <TipRow key={s} color={SEVERITY_COLOR[s]} label={s} value={data[hover.i][s]} />
                ))}
                <div className="mt-1 border-t border-white/10 pt-1">
                  <TipRow label="total" value={total(data[hover.i])} />
                </div>
              </>
            ),
          }
        }
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Weekday x hour heatmap                                              */
/* ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Sequential blue, dark (few) -> light (many) for the dark surface. Index 0 = zero.
const HEAT = ["#1c232c", "#104281", "#1c5cab", "#2a78d6", "#5598e7", "#9ec5f4"];

export const Heatmap = ({ matrix }) => {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);
  const left = 34;
  const top = 4;
  const cell = Math.max(8, Math.min(40, Math.floor((width - left) / 24)));
  const pad = cell > 12 ? 2 : 1;
  const max = Math.max(0, ...matrix.flat());
  const bin = (v) => (v === 0 || max === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  const h = top + cell * 7 + 22;

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={left + cell * 24} height={h} role="img" aria-label="Alerts by weekday and hour">
          {DAYS.map((d, r) => (
            <text key={d} x={left - 8} y={top + r * cell + cell / 2} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--chart-muted)">
              {cell >= 12 || r % 2 === 0 ? d : ""}
            </text>
          ))}
          {[0, 6, 12, 18, 23].map((hr) => (
            <text key={hr} x={left + hr * cell + cell / 2} y={top + cell * 7 + 15} textAnchor="middle" fontSize="11" fill="var(--chart-muted)">
              {String(hr).padStart(2, "0")}h
            </text>
          ))}
          {matrix.map((row, r) =>
            row.map((v, c) => {
              const active = hover && hover.r === r && hover.c === c;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={left + c * cell + pad / 2}
                  y={top + r * cell + pad / 2}
                  width={cell - pad}
                  height={cell - pad}
                  rx={Math.min(4, cell / 5)}
                  fill={HEAT[bin(v)]}
                  stroke={active ? "#e6edf3" : "none"}
                  strokeWidth={active ? 1.5 : 0}
                  tabIndex={0}
                  aria-label={`${DAYS[r]} ${c}:00, ${v} alerts`}
                  style={{ outline: "none" }}
                  onMouseMove={(e) => {
                    const b = ref.current.getBoundingClientRect();
                    setHover({ r, c, x: e.clientX - b.left, y: e.clientY - b.top });
                  }}
                  onFocus={() => setHover({ r, c, x: left + c * cell, y: top + r * cell })}
                  onBlur={() => setHover(null)}
                />
              );
            }),
          )}
        </svg>
      )}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
        <span>Fewer</span>
        {HEAT.map((c) => (
          <span key={c} className="h-2.5 w-4 rounded-sm" style={{ background: c }} />
        ))}
        <span>More</span>
        <span className="ml-auto tabular-nums">peak {max}/hr</span>
      </div>
      <ChartTooltip
        containerWidth={width}
        tip={
          hover && {
            x: hover.x,
            y: hover.y,
            content: (
              <>
                <div className="mb-1 text-[11px] text-gray-400">
                  {DAYS[hover.r]} · {String(hover.c).padStart(2, "0")}:00–{String((hover.c + 1) % 24).padStart(2, "0")}:00
                </div>
                <TipRow label="alerts" value={matrix[hover.r][hover.c]} />
              </>
            ),
          }
        }
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Ranked horizontal bars (single series)                              */
/* ------------------------------------------------------------------ */

export const RankedBars = ({ rows, emptyLabel = "No data" }) => {
  if (!rows.length) {
    return <p className="py-8 text-center text-xs text-gray-500">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key} className="group" title={`${r.label}: ${r.value}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-gray-300">
              {r.label}
              {r.sub && <span className="ml-2 font-mono text-[10px] text-gray-500">{r.sub}</span>}
            </span>
            <span className="tabular-nums font-semibold text-white">{r.value}</span>
          </div>
          <div className="h-2 w-full rounded-r bg-white/[0.03]">
            <div
              className="h-full rounded-r-[4px] transition-all duration-700 group-hover:brightness-125"
              style={{ width: `${(r.value / max) * 100}%`, background: "var(--chart-series-1)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ------------------------------------------------------------------ */
/* Severity split: one segmented bar + labelled counts                 */
/* ------------------------------------------------------------------ */

export const SeveritySplit = ({ counts }) => {
  const sum = SEVERITIES.reduce((s, k) => s + (counts[k] || 0), 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded" aria-hidden>
        {sum === 0 ? (
          <div className="h-full w-full bg-white/5" />
        ) : (
          SEVERITIES.filter((s) => counts[s] > 0).map((s) => (
            <div key={s} style={{ flexGrow: counts[s], background: SEVERITY_COLOR[s] }} />
          ))
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...SEVERITIES].reverse().map((s) => (
          <div key={s} className="rounded-lg bg-black/20 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="h-2 w-2 rounded-sm" style={{ background: SEVERITY_COLOR[s] }} />
              {s}
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {counts[s] || 0}
              <span className="ml-1 text-[11px] font-normal text-gray-500">
                {sum ? `${Math.round(((counts[s] || 0) / sum) * 100)}%` : ""}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
