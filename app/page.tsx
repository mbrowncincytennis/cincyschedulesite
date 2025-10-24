"use client";
import { useEffect, useMemo, useState } from "react";

type Booking = {
  Date: string;
  "Start Time": string;
  "End Time": string;
  "Event Name": string;
  "Space Name": string;
  Owner?: string;
  Notes?: string;
};

type Hotspot = { spaceId: string; polygon: [number, number][] };

// Color scale: 0 bookings → green, 5+ → red
function colorForCount(n: number) {
  const max = 5;
  const t = Math.min(n / max, 1);         // clamp 0..1
  const hue = 140 - 140 * t;              // 140=green → 0=red
  const opacity = n > 0 ? 0.28 + 0.14 * t : 0; // a little stronger as it gets busier
  return `hsl(${hue} 70% 45% / ${opacity})`;
}

export default function Page() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Load hotspots once
  useEffect(() => {
    fetch("/hotspots.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setHotspots)
      .catch(() => setHotspots([]));
  }, []);

  // Load bookings whenever date changes
  const loadBookings = () =>
    fetch(`/api/bookings?date=${date}`)
      .then((r) => r.json())
      .then(setBookings)
      .catch(() => setBookings([]));

  useEffect(loadBookings, [date]);

  // Poll every 30s
  useEffect(() => {
    const id = setInterval(loadBookings, 30_000);
    return () => clearInterval(id);
  }, [date]);

  // Map bookings by space
  const bySpace = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const key = (b["Space Name"] || "").trim();
      if (!key) return;
      const arr = m.get(key) || [];
      arr.push(b);
      m.set(key, arr);
    });
    return m;
  }, [bookings]);

  // Sidebar selection
  const selectedBookings = selected ? bySpace.get(selected) || [] : [];

  // Simple tooltip text
  function previewText(spaceId: string) {
    const rows = bySpace.get(spaceId) || [];
    if (!rows.length) return `${spaceId}\nNo bookings`;
    const first = rows[0];
    const more = rows.length > 1 ? ` (+${rows.length - 1} more)` : "";
    return `${spaceId}\n${first["Event Name"]} — ${first["Start Time"]}–${first["End Time"]}${more}`;
  }

  // Detail text (fallback used in alert previously)
  function detailText(spaceId: string) {
    const rows = bySpace.get(spaceId) || [];
    if (!rows.length) return `${spaceId}\nNo bookings for this date.`;
    const lines = rows.map(
      (r) =>
        `${r["Event Name"]} — ${r["Start Time"]} to ${r["End Time"]}${
          r["Owner"] ? " • " + r["Owner"] : ""
        }${r["Notes"] ? " — " + r["Notes"] : ""}`
    );
    return [spaceId, ...lines].join("\n");
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0, fontFamily: "Montserrat, Inter, sans-serif", fontWeight: 700 }}>
          Site Usage Map
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13 }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "6px 10px",
              font: "inherit",
            }}
          />
        </div>
      </header>

      {/* Main card */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: selected ? "1fr 340px" : "1fr",
          gap: 16,
          padding: "0 20px 20px",
        }}
      >
        {/* Map card */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            padding: 12,
            position: "relative",
          }}
        >
          <div style={{ position: "relative" }}>
            <img
              src="/site-map.png"
              alt="Site Map"
              style={{ width: "100%", height: "auto", borderRadius: 12, display: "block" }}
            />

            {/* Color polygons by intensity */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {hotspots.map((h) => {
                const count = bySpace.get(h.spaceId)?.length || 0;
                const d = "M " + h.polygon.map((pt) => pt[0] + " " + pt[1]).join(" L ") + " Z";
                const isHover = hover === h.spaceId;
                return (
                  <path
                    key={h.spaceId}
                    d={d}
                    style={{
                      fill: colorForCount(count),
                      stroke: isHover ? "#111" : count ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)",
                      strokeWidth: isHover ? 0.9 : 0.6,
                      transition: "stroke .15s ease, fill .15s ease",
                    }}
                  />
                );
              })}
            </svg>

            {/* Invisible hit targets + tooltip triggers */}
            <div style={{ position: "absolute", inset: 0 }}>
              {hotspots.map((h) => {
                const xs = h.polygon.map((p) => p[0]);
                const ys = h.polygon.map((p) => p[1]);
                const minX = Math.min(...xs),
                  maxX = Math.max(...xs);
                const minY = Math.min(...ys),
                  maxY = Math.max(...ys);

                const style: any = {
                  position: "absolute",
                  left: `${minX}%`,
                  top: `${minY}%`,
                  width: `${maxX - minX}%`,
                  height: `${maxY - minY}%`,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                };

                return (
                  <button
                    key={h.spaceId}
                    aria-label={h.spaceId}
                    style={style}
                    onMouseEnter={(e) => {
                      setHover(h.spaceId);
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        text: previewText(h.spaceId),
                      });
                    }}
                    onMouseLeave={() => {
                      setHover(null);
                      setTooltip(null);
                    }}
                    onClick={() => setSelected(h.spaceId)}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#6b7280",
              fontSize: 12,
            }}
          >
            <span>Intensity:</span>
            {[0, 1, 3, 5].map((n) => (
              <span
                key={n}
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 10,
                  borderRadius: 4,
                  background: colorForCount(n || 0.5), // show slight tint for 0
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
                title={`${n} bookings`}
              />
            ))}
            <span>(0 → 5+ bookings)</span>
          </div>
        </div>

        {/* Details panel */}
        {selected && (
          <aside
            style={{
              background: "white",
              borderRadius: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              padding: 16,
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelected(null)}
              aria-label="Close details"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#f2f2f2",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <h2 style={{ margin: "0 0 6px", fontFamily: "Montserrat, Inter, sans-serif" }}>
              {selected}
            </h2>
            <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: 13 }}>
              {selectedBookings.length
                ? `${selectedBookings.length} booking${selectedBookings.length > 1 ? "s" : ""} on ${
                    date
                  }`
                : `No bookings on ${date}`}
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              {selectedBookings.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    border: "1px solid #eef0f2",
                    borderRadius: 12,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{r["Event Name"]}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {r["Start Time"]} – {r["End Time"]}
                    {r["Owner"] ? ` • ${r["Owner"]}` : ""}
                  </div>
                  {r["Notes"] && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{r["Notes"]}</div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </section>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
            background: "rgba(17,17,17,0.92)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "pre-line",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            zIndex: 50,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </main>
  );
}
