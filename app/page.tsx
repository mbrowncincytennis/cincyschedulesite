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

export default function Page() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  // Load hotspots once
  useEffect(() => {
    fetch("/hotspots.json")
      .then(r => r.ok ? r.json() : [])
      .then(setHotspots)
      .catch(() => setHotspots([]));
  }, []);

  // Load bookings whenever the date changes
  useEffect(() => {
    fetch(`/api/bookings?date=${date}`)
      .then(r => r.json())
      .then(setBookings);
  }, [date]);

  // Poll bookings every 30s to auto-refresh while open
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`/api/bookings?date=${date}`)
        .then(r => r.json())
        .then(setBookings);
    }, 30_000);
    return () => clearInterval(id);
  }, [date]);

  const bySpace = useMemo(() => {
    const m = new Map<string, Booking[]>();
    bookings.forEach(b => {
      const key = (b["Space Name"] || "").trim();
      if (!key) return;
      const arr = m.get(key) || [];
      arr.push(b);
      m.set(key, arr);
    });
    return m;
  }, [bookings]);

  return (
    <main style={{minHeight:"100vh", background:"#f6f7f8", color:"#111"}}>
      <header style={{maxWidth:1100, margin:"0 auto", padding:"16px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <h1 style={{fontSize:20, fontWeight:600, margin:0}}>Site Usage Map</h1>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <label style={{fontSize:13}}>Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{border:"1px solid #ddd", borderRadius:8, padding:"6px 8px"}} />
        </div>
      </header>

      <section style={{maxWidth:1100, margin:"0 auto", background:"white", borderRadius:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", padding:12}}>
        <div style={{position:"relative"}}>
          <img src="/site-map.png" alt="Site Map" style={{width:"100%", height:"auto", borderRadius:12, display:"block"}} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
               style={{position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none"}}>
            {hotspots.map(h => {
              const has = (bySpace.get(h.spaceId)?.length || 0) > 0;
              const d = "M " + h.polygon.map(pt => pt[0] + " " + pt[1]).join(" L ") + " Z";
              const isHover = hover === h.spaceId;
              return (
                <path key={h.spaceId} d={d}
                  style={{ fill: has ? "rgba(0,0,0,0.12)" : "transparent",
                           stroke: isHover ? "#111" : "rgba(0,0,0,0.5)", strokeWidth: isHover ? 0.9 : 0.6 }} />
              );
            })}
          </svg>

          <div style={{position:"absolute", inset:0}}>
            {hotspots.map(h => {
              const xs = h.polygon.map(p=>p[0]);
              const ys = h.polygon.map(p=>p[1]);
              const minX = Math.min(...xs), maxX = Math.max(...xs);
              const minY = Math.min(...ys), maxY = Math.max(...ys);
              const style:any = { position:"absolute", left:`${minX}%`, top:`${minY}%`, width:`${maxX-minX}%`, height:`${maxY-minY}%`, background:"transparent", border:"none", cursor:"pointer" };
              return (
                <button key={h.spaceId} aria-label={h.spaceId} style={style}
                        onMouseEnter={()=>setHover(h.spaceId)} onMouseLeave={()=>setHover(null)}
                        onClick={()=>alert(detailText(h.spaceId, bySpace))} />
              );
            })}
          </div>
        </div>
        <p style={{fontSize:12, color:"#6b7280", marginTop:8}}>Shaded areas indicate at least one booking on the selected date. Click an area for details.</p>
      </section>
    </main>
  );
}

function detailText(spaceId: string, bySpace: Map<string, any[]>) {
  const rows = bySpace.get(spaceId) || [];
  if (!rows.length) return `${spaceId}\nNo bookings for this date.`;
  const lines = rows
    .map(r => `${r["Event Name"]} — ${r["Start Time"]} to ${r["End Time"]}${r["Owner"] ? " • " + r["Owner"] : ""}${r["Notes"] ? " — " + r["Notes"] : ""}`);
  return [spaceId, ...lines].join("\n");
}
