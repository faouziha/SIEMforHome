import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Flame,
  Activity,
  Table2,
  BarChart3,
  RefreshCcw,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { securityService } from "../services/api";
import { SecurityContext } from "../context/SecurityContext";
import {
  StackedTimeline,
  Heatmap,
  RankedBars,
  SeveritySplit,
  SeverityLegend,
} from "../components/charts";
import { formatBucket } from "../utils/chartUtils";
import { SEVERITIES, SEVERITY_CLASSES, normalizeSeverity } from "../utils/severity";

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const Card = ({ title, subtitle, action, children, className = "" }) => (
  <section className={`card p-4 md:p-6 animate-fade-up ${className}`}>
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </header>
    {children}
  </section>
);

const StatTile = ({ icon, label, value, children }) => (
  <div className="card p-4 animate-fade-up">
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-400">
      {React.createElement(icon, { size: 14, className: "text-gray-500" })} {label}
    </div>
    <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    {children && <div className="mt-1 text-xs text-gray-400">{children}</div>}
  </div>
);

const HistoryPage = () => {
  const { alerts } = useContext(SecurityContext);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableView, setTableView] = useState(false);
  const [sevFilter, setSevFilter] = useState("All");

  const load = async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityService.getAlertHistory(d);
      setData(res.data);
    } catch (e) {
      console.error("History fetch failed", e);
      setError("Could not reach the SIEM backend. Is the Django server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Re-pull aggregates when the live alert feed changes (30s polling in context)
  useEffect(() => {
    if (data) load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length]);

  const incidents = useMemo(() => {
    const since = Date.now() - days * 86400000;
    return alerts
      .filter((a) => new Date(a.timestamp).getTime() >= since)
      .filter((a) => sevFilter === "All" || normalizeSeverity(a.severity) === sevFilter)
      .slice(0, 50);
  }, [alerts, days, sevFilter]);

  const t = data?.totals;
  const delta = t ? t.total - t.previous_period : 0;
  const deltaPct = t && t.previous_period ? Math.round((delta / t.previous_period) * 100) : null;
  const resolvedPct = t && t.total ? Math.round((t.resolved / t.total) * 100) : 100;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header + range filter (one row, above all charts) */}
      <div className="mb-6 flex flex-col gap-4 border-b border-cyber-line pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <span className="rounded-lg bg-matrix-green/10 p-2 text-matrix-green">
              <HistoryIcon size={20} />
            </span>
            Exposure History
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            How vulnerabilities and exposed services on your network have changed over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Time range" className="flex rounded-lg border border-cyber-line bg-black/30 p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                role="radio"
                aria-checked={days === r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === r.days ? "bg-matrix-green text-black" : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            className="rounded-lg border border-cyber-line bg-black/30 p-2 text-gray-400 hover:text-white"
            aria-label="Refresh"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-sev-high/40 bg-sev-high/10 px-4 py-3 text-sm text-sev-critical">
          {error}
        </div>
      )}

      {!data && loading && (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
          <div className="card h-72 animate-pulse md:col-span-4" />
        </div>
      )}

      {data && (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={Activity} label="Alerts in range" value={t.total}>
              {deltaPct === null ? (
                <span className="text-gray-500">no prior-period data</span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  {delta > 0 ? <TrendingUp size={13} className="text-sev-high" /> : <TrendingDown size={13} className="text-matrix-green" />}
                  <span className="tabular-nums text-white">{delta > 0 ? "+" : ""}{deltaPct}%</span> vs previous {RANGES.find((r) => r.days === days)?.label}
                </span>
              )}
            </StatTile>
            <StatTile icon={Flame} label="Still open" value={t.open}>
              of {t.total} raised
            </StatTile>
            <StatTile icon={ShieldCheck} label="Resolved" value={`${resolvedPct}%`}>
              <span className="tabular-nums">{t.resolved}</span> handled
            </StatTile>
            <StatTile icon={BarChart3} label={data.granularity === "hour" ? "Busiest hour" : "Busiest day"} value={t.peak_count}>
              {t.peak_bucket ? formatBucket(t.peak_bucket, data.granularity, true) : "quiet period"}
            </StatTile>
          </div>

          {/* Timeline */}
          <Card
            title="Alerts over time"
            subtitle={`Per ${data.granularity}, stacked by severity`}
            action={
              <div className="flex items-center gap-4">
                <SeverityLegend />
                <button
                  onClick={() => setTableView((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-cyber-line px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                  {tableView ? <BarChart3 size={14} /> : <Table2 size={14} />}
                  {tableView ? "Chart" : "Table"}
                </button>
              </div>
            }
          >
            {tableView ? (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-xs tabular-nums">
                  <thead className="sticky top-0 bg-cyber-gray text-left text-gray-400">
                    <tr>
                      <th className="py-2 pr-4 font-medium">{data.granularity === "hour" ? "Hour" : "Date"}</th>
                      {SEVERITIES.map((s) => (
                        <th key={s} className="py-2 pr-4 text-right font-medium">{s}</th>
                      ))}
                      <th className="py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-line">
                    {[...data.timeline].reverse().map((b) => (
                      <tr key={b.bucket}>
                        <td className="py-1.5 pr-4 text-gray-300">{formatBucket(b.bucket, data.granularity, true)}</td>
                        {SEVERITIES.map((s) => (
                          <td key={s} className="py-1.5 pr-4 text-right">{b[s]}</td>
                        ))}
                        <td className="py-1.5 text-right font-semibold">{SEVERITIES.reduce((n, s) => n + b[s], 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : t.total === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-gray-500">
                <ShieldCheck size={28} className="text-matrix-green" />
                <p className="text-sm">No alerts in this period.</p>
              </div>
            ) : (
              <StackedTimeline data={data.timeline} granularity={data.granularity} />
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card title="When alerts are raised" subtitle="Alerts by weekday and hour of day" className="lg:col-span-3">
              <div className="overflow-x-auto">
                <Heatmap matrix={data.heatmap} />
              </div>
            </Card>
            <Card title="Severity mix" subtitle="Share of alerts in range" className="lg:col-span-2">
              <SeveritySplit counts={data.by_severity} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Top findings" subtitle="Most frequent alert categories">
              <RankedBars
                rows={data.by_type.map((r) => ({ key: r.alert_type, label: r.alert_type, value: r.count }))}
                emptyLabel="No findings recorded"
              />
            </Card>
            <Card title="Most exposed devices" subtitle="Devices linked to the most alerts">
              <RankedBars
                rows={data.top_devices.map((r, i) => ({ key: `${r.device}-${i}`, label: r.device, sub: r.ip, value: r.count }))}
                emptyLabel="No device-linked alerts"
              />
            </Card>
          </div>

          {/* Incident log */}
          <Card
            title="Incident log"
            subtitle="Every alert in range, including resolved ones (latest 50)"
            action={
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value)}
                className="rounded-md border border-cyber-line bg-black/30 px-2 py-1 text-xs text-gray-300"
              >
                <option value="All">All severities</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            }
          >
            {incidents.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-500">No incidents match.</p>
            ) : (
              <ol className="relative ml-2 border-l border-cyber-line">
                {incidents.map((a) => {
                  const sev = normalizeSeverity(a.severity);
                  return (
                    <li key={a.id} className="mb-4 ml-5">
                      <span className="absolute -left-[7px] mt-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyber-black">
                        {a.is_resolved ? (
                          <CheckCircle2 size={14} className="text-matrix-green" />
                        ) : (
                          <CircleDot size={14} className="text-sev-high" />
                        )}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_CLASSES[sev]}`}>{sev}</span>
                        <span className="text-[11px] uppercase tracking-wider text-gray-500">{a.alert_type}</span>
                        <time className="ml-auto font-mono text-[11px] text-gray-500">
                          {new Date(a.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-gray-200">{a.description}</p>
                      {a.device_hostname && <p className="mt-0.5 font-mono text-[11px] text-gray-500">{a.device_hostname}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
