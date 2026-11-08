import { useLayoutEffect, useRef, useState } from "react";

// Track an element's width so SVG charts can lay out in real pixels
// (no viewBox stretching = crisp text and hairlines at every size).
export const useElementWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
};

export const formatBucket = (bucket, granularity, long = false) => {
  // bucket: "YYYY-MM-DD" or "YYYY-MM-DDTHH:00" (server local time)
  const [d, t] = bucket.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day, t ? Number(t.slice(0, 2)) : 0);
  if (granularity === "hour") {
    const hh = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return long ? `${date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${hh}` : hh;
  }
  return date.toLocaleDateString([], long
    ? { weekday: "short", month: "short", day: "numeric", year: "numeric" }
    : { month: "short", day: "numeric" });
};
