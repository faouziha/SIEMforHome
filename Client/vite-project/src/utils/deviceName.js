// Human-friendly device naming.
// The scanner stores placeholder hostnames like "Device-192.168.100.22" when it
// can't resolve one; those add nothing over the IP, so we treat them as "no name".

const PLACEHOLDER_HOST = /^device-[\d.]+$/i;
const PLACEHOLDER_VENDOR = /^(unknown|generic)/i;

/** The real name of the device (nickname or resolved hostname), or null. */
export const realName = (d) => {
  if (!d) return null;
  if (d.nickname) return d.nickname;
  if (d.hostname && !PLACEHOLDER_HOST.test(d.hostname)) return d.hostname;
  return null;
};

/** Vendor without legal suffixes, or null if it's a placeholder. */
export const shortVendor = (d) => {
  const v = d?.vendor?.trim();
  if (!v || PLACEHOLDER_VENDOR.test(v)) return null;
  return v
    .replace(/[,.]?\s+(inc|ltd|llc|co|corp|corporation|limited|gmbh|s\.?a|pte)\.?\b.*$/i, "")
    .replace(/\s+(electronics|technology|technologies|systems)\b.*$/i, "")
    .trim();
};

/** Real hostname from the scanner (placeholders excluded), or null. */
export const realHostname = (d) => (d?.hostname && !PLACEHOLDER_HOST.test(d.hostname) ? d.hostname : null);

/** Generated fallback name: vendor + last IP octet, e.g. "Samsung .22". */
export const autoName = (d) => {
  const octet = d?.ip_address ? d.ip_address.split(".").pop() : null;
  const base = shortVendor(d) || "Device";
  return octet ? `${base} .${octet}` : base;
};

/** True when the shown name was generated rather than set/resolved. */
export const isAutoNamed = (d) => !realName(d);

/** Every device always has a name: nickname, real hostname, or generated. */
export const deviceTitle = (d) => realName(d) || autoName(d);

/** Secondary label: the IP. */
export const deviceSubtitle = (d) => d?.ip_address || "";
