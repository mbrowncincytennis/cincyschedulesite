import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // be explicit

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
  const parts = d.split(/[/.-]/).map(x => x.trim());
  if (parts.length === 3) {
    const [m, day, y] = parts.map(Number);
    const dt = new Date(y, m - 1, day);
    if (!isNaN(+dt)) return dt;
  }
  return new Date(d);
}

// Safe CSV splitter (handles quoted commas)
function splitCsvLine(line: string) {
  return line.match(/(?<=^|,)(?:"[^"]*"|[^,]*)/g)?.map(s =>
    s.replace(/^"|"$/g, "").replace(/\\"/g, '"').trim()
  ) ?? [];
}

export async function GET(req: NextRequest) {
  try {
    const urlParams = req.nextUrl.searchParams;
    const date = urlParams.get("date"); // YYYY-MM-DD
    const debug = urlParams.get("debug") === "1";
    const sheet = process.env.SHEET_ID || "1Oxj8FXI9h4czJMP5C18gl_AlGa1TOALk1xkgX77VBUI";
    const url = `https://docs.google.com/spreadsheets/d/${sheet}/gviz/tq?tqx=out:csv`;

    const res = await fetch(url, { cache: "no-store" });

    // If Google denies access or ID is wrong:
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const msg = {
        error: "Failed to fetch Google Sheet CSV",
        status: res.status,
        hint: "Is the sheet shared as 'Anyone with the link can view'? Is SHEET_ID correct?",
        bodySnippet: body.slice(0, 300)
      };
      return new Response(JSON.stringify(msg), {
        status: 502,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store"
        }
      });
    }

    const csv = await res.text();
    if (debug) {
      return new Response(JSON.stringify({ ok: true, first200: csv.slice(0, 200) }), {
        headers: { "content-type": "application/json", "cache-control": "no-store" }
      });
    }

    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV appears empty or headers missing." }), {
        status: 200,
        headers: { "content-type": "application/json", "cache-control": "no-store" }
      });
    }

    const headers = splitCsvLine(lines[0]);
    const rows: Row[] = lines.slice(1).map(line => {
      const cells = splitCsvLine(line);
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
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

    return new Response(JSON.stringify(filtered), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
      }
    });
  } catch (err: any) {
    // Never crash—always return a JSON error we can see in the browser
    return new Response(JSON.stringify({ error: "Server error", message: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }
}
