// ...imports & types unchanged...
export default function Page() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // NEW: map vs list
  const [mode, setMode] = useState<"map" | "list">("map");

  // ...hotspots effect, loadBookings, polling unchanged...

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

  // NEW: flat, nicely-sorted list for the List view
  const allEvents = useMemo(() => {
    const to24 = (t: string) => {
      // Convert “8:05 AM” to 08:05 for sorting
      const m = t.trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
      if (!m) return t;
      let h = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      const ampm = m[3].toUpperCase();
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    };
    const arr = bookings.slice();
    arr.sort((a, b) => {
      const at = to24(a["Start Time"] || ""), bt = to24(b["Start Time"] || "");
      if (at < bt) return -1;
      if (at > bt) return 1;
      return (a["Space Name"] || "").localeCompare(b["Space Name"] || "");
    });
    return arr;
  }, [bookings]);

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{maxWidth:1200, margin:"0 auto", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <h1 style={{ margin: 0 }}>Site Usage Map</h1>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ fontSize:13 }}>Date</label>
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)}
                 style={{ border:"1px solid #ddd", borderRadius:10, padding:"6px 10px" }}/>
          {/* NEW: view toggle */}
          <div style={{ marginLeft:8, display:"flex", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
            <button onClick={()=>setMode("map")}
              style={{ padding:"6px 10px", border:"none", background: mode==="map"?"#111":"#fff", color: mode==="map"?"#fff":"#111", cursor:"pointer" }}>
              Map
            </button>
            <button onClick={()=>setMode("list")}
              style={{ padding:"6px 10px", border:"none", background: mode==="list"?"#111":"#fff", color: mode==="list"?"#fff":"#111", cursor:"pointer" }}>
              List
            </button>
          </div>
        </div>
      </header>

      {/* CHANGED: grid only when map is shown with details */}
      <section style={{
        maxWidth:1200, margin:"0 auto", padding:"0 20px 20px",
        display: mode==="map" ? "grid" : "block",
        gridTemplateColumns: mode==="map" && selected ? "1fr 340px" : "1fr",
        gap:16
      }}>
        {mode === "map" ? (
          <>
            {/* existing Map card + Details panel here (unchanged) */}
          </>
        ) : (
          // NEW: List view
          <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 1px 4px rgba(0,0,0,.06)", padding:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <h2 style={{ margin:0 }}>All Events on {date}</h2>
              <div style={{ fontSize:12, color:"#6b7280" }}>{allEvents.length} total</div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0 }}>
                <thead>
                  <tr style={{ textAlign:"left", fontSize:13, color:"#6b7280" }}>
                    <th style={{ padding:"8px 10px" }}>Start</th>
                    <th style={{ padding:"8px 10px" }}>End</th>
                    <th style={{ padding:"8px 10px" }}>Event</th>
                    <th style={{ padding:"8px 10px" }}>Space</th>
                    <th style={{ padding:"8px 10px" }}>Owner</th>
                    <th style={{ padding:"8px 10px" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allEvents.map((r, i) => (
                    <tr key={i} style={{ borderTop:"1px solid #f0f2f5" }}>
                      <td style={{ padding:"10px" }}>{r["Start Time"]}</td>
                      <td style={{ padding:"10px" }}>{r["End Time"]}</td>
                      <td style={{ padding:"10px", fontWeight:600 }}>{r["Event Name"]}</td>
                      <td style={{ padding:"10px" }}>{r["Space Name"]}</td>
                      <td style={{ padding:"10px" }}>{r["Owner"] || ""}</td>
                      <td style={{ padding:"10px", color:"#6b7280" }}>{r["Notes"] || ""}</td>
                    </tr>
                  ))}
                  {allEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding:"14px", color:"#6b7280" }}>No events for this date.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      {/* tooltip code stays as-is if mode==="map" */}
      {mode==="map" && tooltip && (/* ...existing tooltip... */)}
    </main>
  );
}
