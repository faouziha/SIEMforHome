import React, { useContext, useEffect, useRef, useState } from "react";
import { X, Pencil, Check, Loader2, Cpu, Clock, ShieldCheck, ShieldQuestion, Network, Lock, Unlock } from "lucide-react";
import { SecurityContext } from "../context/SecurityContext";
import { securityService } from "../services/api";
import { deviceTitle, isAutoNamed, autoName, realHostname } from "../utils/deviceName";
import { SEVERITIES, SEVERITY_CLASSES, normalizeSeverity, severityRank } from "../utils/severity";

const timeAgo = (iso) => {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

const Field = ({ label, children, mono }) => (
  <div className="min-w-0">
    <dt className="text-[10px] uppercase tracking-wider text-gray-500">{label}</dt>
    <dd className={`mt-0.5 truncate text-sm text-gray-200 ${mono ? "font-mono" : ""}`}>{children || "—"}</dd>
  </div>
);

/** Inline rename: Enter saves, Escape cancels, empty resets to the automatic name. */
const NameEditor = ({ device, onDone }) => {
  const { refreshData } = useContext(SecurityContext);
  const [value, setValue] = useState(device.nickname || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.select(), []);

  const save = async () => {
    const nickname = value.trim();
    if (nickname === (device.nickname || "")) return onDone();
    if (nickname.length > 100) return setError("Max 100 characters");
    setSaving(true);
    setError(null);
    try {
      await securityService.updateDevice(device.id, { nickname: nickname || null });
      await refreshData();
      onDone();
    } catch (e) {
      console.error("Rename failed", e);
      setError("Could not save. Is the backend running?");
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          maxLength={100}
          disabled={saving}
          placeholder={realHostname(device) || autoName(device)}
          aria-label="Device name"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              e.stopPropagation(); // don't close the drawer
              onDone();
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-matrix-green/40 bg-black/40 px-2 py-1 text-sm text-white placeholder:text-gray-600 focus:border-matrix-green focus:outline-none"
        />
        <button onClick={save} disabled={saving} className="rounded p-1 text-matrix-green hover:bg-matrix-green/10" aria-label="Save name">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
        <button onClick={onDone} disabled={saving} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white" aria-label="Cancel rename">
          <X size={16} />
        </button>
      </div>
      <p className={`mt-1 text-[11px] ${error ? "text-sev-critical" : "text-gray-500"}`}>
        {error || "Enter to save · Esc to cancel · leave empty to reset"}
      </p>
    </div>
  );
};

/**
 * Device info card. `compact` = hover version for the topology map
 * (fewer alerts, no close button).
 */
const DeviceCard = ({ device, onClose, compact = false }) => {
  const { alerts } = useContext(SecurityContext);
  const [editing, setEditing] = useState(false);
  if (!device) return null;

  const deviceAlerts = alerts
    .filter((a) => a.related_device === device.id && !a.is_resolved)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
  deviceAlerts.forEach((a) => counts[normalizeSeverity(a.severity)]++);
  const services = device.services || [];
  const name = deviceTitle(device);
  const auto = isAutoNamed(device);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-cyber-line p-4">
        <div className={`rounded-lg p-2 ${device.is_whitelisted ? "bg-matrix-green/10 text-matrix-green" : "bg-sev-high/10 text-sev-high"}`}>
          {device.is_whitelisted ? <ShieldCheck size={20} /> : <ShieldQuestion size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <NameEditor device={device} onDone={() => setEditing(false)} />
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className={`truncate font-semibold ${auto ? "text-gray-300" : "text-white"}`} title={name}>
                {name}
              </h3>
              {auto && (
                <span className="shrink-0 rounded bg-white/5 px-1 text-[9px] uppercase tracking-wider text-gray-500" title="Generated from vendor and IP">
                  auto
                </span>
              )}
              {!compact && (
                <button
                  onClick={() => setEditing(true)}
                  className="shrink-0 rounded p-1 text-gray-500 hover:bg-white/5 hover:text-matrix-green"
                  aria-label="Rename device"
                  title="Rename"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}
          {!editing && <p className="truncate font-mono text-xs text-gray-400">{device.ip_address}</p>}
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${
            device.is_whitelisted
              ? "bg-matrix-green/10 text-matrix-green ring-matrix-green/30"
              : "bg-sev-high/10 text-sev-critical ring-sev-high/30"
          }`}
        >
          {device.is_whitelisted ? "Trusted" : "Unverified"}
        </span>
        {onClose && (
          <button onClick={onClose} className="-mr-1 -mt-1 rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-5 p-4">
        {/* Identity */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Hostname" mono>{realHostname(device)}</Field>
          <Field label="Vendor">{device.vendor}</Field>
          <Field label="MAC address" mono>{device.mac_address}</Field>
          <Field label="OS">
            {device.os_type && <Cpu size={12} className="mr-1 inline text-gray-500" />}
            {device.os_type}
          </Field>
          <Field label="Last seen">
            <Clock size={12} className="mr-1 inline text-gray-500" />
            {timeAgo(device.last_seen)}
          </Field>
          <Field label="Open alerts">
            <span className="tabular-nums">{deviceAlerts.length}</span>
          </Field>
        </dl>

        {/* Severity breakdown */}
        {deviceAlerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[...SEVERITIES].reverse().filter((s) => counts[s]).map((s) => (
              <span key={s} className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_CLASSES[s]}`}>
                {counts[s]} {s}
              </span>
            ))}
          </div>
        )}

        {/* Services */}
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
            <Network size={12} /> Open services ({services.length})
          </h4>
          {services.length === 0 ? (
            <p className="text-xs text-gray-500">No open ports recorded. Run a scan to populate.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {services.slice(0, compact ? 8 : 50).map((s) => (
                <li
                  key={`${s.port}/${s.protocol}`}
                  title={s.is_secure ? "Considered secure" : "Insecure service"}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] ring-1 ring-inset ${
                    s.is_secure ? "bg-white/[0.03] text-gray-300 ring-cyber-line" : "bg-sev-high/10 text-sev-critical ring-sev-high/30"
                  }`}
                >
                  {s.is_secure ? <Lock size={10} /> : <Unlock size={10} />}
                  {s.port}/{s.protocol}
                  {s.service_name && <span className="text-gray-500">{s.service_name}</span>}
                </li>
              ))}
              {compact && services.length > 8 && <li className="px-1 py-1 text-[11px] text-gray-500">+{services.length - 8} more</li>}
            </ul>
          )}
        </section>

        {/* Alerts */}
        {deviceAlerts.length > 0 && (
          <section>
            <h4 className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">Open alerts</h4>
            <ul className="space-y-2">
              {deviceAlerts.slice(0, compact ? 3 : 20).map((a) => {
                const sev = normalizeSeverity(a.severity);
                return (
                  <li key={a.id} className="rounded-lg bg-black/20 p-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-1 text-[9px] font-bold uppercase ${SEVERITY_CLASSES[sev]}`}>{sev}</span>
                      <span className="truncate text-[11px] text-gray-400">{a.alert_type}</span>
                    </div>
                    {!compact && <p className="mt-1 text-xs text-gray-300">{a.description}</p>}
                  </li>
                );
              })}
              {compact && deviceAlerts.length > 3 && (
                <li className="text-[11px] text-gray-500">+{deviceAlerts.length - 3} more</li>
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

/** Slide-over panel wrapper used on the Devices page. */
export const DeviceDrawer = ({ device, onClose }) => {
  useEffect(() => {
    if (!device) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [device, onClose]);

  if (!device) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-cyber-black p-4 animate-fade-up">
        <DeviceCard device={device} onClose={onClose} />
      </div>
    </div>
  );
};

export default DeviceCard;
