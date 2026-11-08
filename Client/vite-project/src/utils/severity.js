// Single source of truth for severity labels, ordering and colors.
// Colors are a one-hue ordinal ramp (brighter = more severe), validated against
// the #161b22 card surface. Always show the label next to the color.

export const SEVERITIES = ["Low", "Medium", "High", "Critical"];

export const SEVERITY_COLOR = {
  Low: "#6e5a4a",
  Medium: "#a8642f",
  High: "#e0743a",
  Critical: "#ffb08a",
};

// Tailwind classes for badges / alert rows
export const SEVERITY_CLASSES = {
  Low: "border-sev-low/60 bg-sev-low/10 text-[#c9b5a5]",
  Medium: "border-sev-medium/60 bg-sev-medium/10 text-[#e8a670]",
  High: "border-sev-high/70 bg-sev-high/10 text-sev-high",
  Critical: "border-sev-critical/80 bg-sev-critical/15 text-sev-critical",
};

export const normalizeSeverity = (s) => {
  const v = String(s || "Low").trim();
  const cap = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  return SEVERITIES.includes(cap) ? cap : "Low";
};

export const severityRank = (s) => SEVERITIES.indexOf(normalizeSeverity(s));
