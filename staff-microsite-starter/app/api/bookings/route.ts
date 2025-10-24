
import { NextRequest } from "next/server";

type Row = {
  "Date": string;
  "Start Time": string;
  "End Time": string;
  "Event Name": string;
  "Space Name": string;
  "Owner"?: string;
  "Notes"?: string;
};

function parseDate(d: string) {
  const try1 = new Date(d);
  if (!isNaN(+try1)) return try1;
  const parts = d.split(/[/.-]/).map(x=>x.trim());
  if (parts.length === 3) {
    const [m, day, y] = parts.map(Number);
    const dt = new Date(y, m-1, day);
    if (!isNaN(+dt)) return dt;
  }
  return new Date(d);
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  const sheet = process.env.SHEET_ID || "1Oxj8FXI9h4czJMP5C18gl_AlGa1TOALk1xkgX77VBUI";
  const url = `https://docs.google.com/spreadsheets/d/${sheet}/gviz/tq?tqx=out:csv`;

  const res = await fetch(url);
  const csv = await res.text();

  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map(h=>h.trim());
  const rows: Row[] = lines.slice(1).map(line => {
    const cells = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g, "").replace(/\\"/g,'"').trim());
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = cells[i] ?? "");
    return obj as Row;
  });

  let filtered = rows;
  if (date) {
    const d0 = new Date(date + "T00:00:00");
    const d1 = new Date(date + "T23:59:59");
    filtered = rows.filter(r => {
      const dt = parseDate(r["Date"]);
      return dt >= d0 && dt <= d1;
    });
  }

  return new Response(JSON.stringify(filtered), { headers: { "content-type": "application/json" } });
}

mv staff-microsite-starter/* .
mv staff-microsite-starter/.* . 2>/dev/null || true
rmdir staff-microsite-starter
