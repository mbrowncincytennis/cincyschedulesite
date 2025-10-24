
# Staff Microsite Starter

This starter gives you two parts:

1) **Hotspot Editor** (no install needed): draw polygons over your site map and export `hotspots.json`.
2) **Microsite (Next.js)**: a password-protected site that shows bookings per area from your Google Sheet.

## 1) Hotspot Editor
- Open `hotspot-editor/index.html` in your browser.
- Click **Start Polygon**, click points to trace an area, double‑click to finish, and name it (e.g., "Court 1").
- Repeat for every court/building.
- Click **Export hotspots.json** and save the file.

The editor defaults to the included `site-map.png` (your uploaded map). You can also load any other image.

## 2) Microsite (Next.js)
### Configure
- Replace the placeholder `public/hotspots.json` with the file you exported from the editor.
- The site already includes your map at `public/site-map.png`.
- The data endpoint reads your Google Sheet as CSV. Set these environment variables on Vercel:
  - `SITE_PASSWORD=StaffSched26!`
  - `SHEET_ID=1Oxj8FXI9h4czJMP5C18gl_AlGa1TOALk1xkgX77VBUI`

Your sheet should have headers exactly:
`Date | Start Time | End Time | Event Name | Space Name | Owner | Notes`

### Run locally (optional)
```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll be redirected to **/login**; use the password from `SITE_PASSWORD`.

### Deploy (Vercel)
1. Create a new project on https://vercel.com (Import from Git).
2. Add the repo with these files.
3. In **Environment Variables**, add:
   - `SITE_PASSWORD` = `StaffSched26!`
   - `SHEET_ID` = `1Oxj8FXI9h4czJMP5C18gl_AlGa1TOALk1xkgX77VBUI`
4. Deploy. Visit your site, login, select date, and click areas.

### Notes
- Ensure your Google Sheet sharing is set to "Anyone with the link can view" for the CSV to load. Alternatively, we can switch to a service account in a later iteration.
- We can upgrade the on-click alert to a nice side panel / tooltip and add color-coding by event type.
