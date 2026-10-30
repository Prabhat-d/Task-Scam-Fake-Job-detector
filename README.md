# JobKavach – Frontend

AI task-scam and fake job-offer detector · Problem **CTBF-AI-11** · Consumer Protection and Public Safety
Managed by **DAXDEV Team**.

React 18 + Vite · React Router v6 · Tailwind CSS v3 · Zustand · Axios · socket.io-client · react-i18next (EN / हिंदी / ਪੰਜਾਬੀ) · Recharts · lucide-react · react-hot-toast · react-dropzone.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
```

`.env` (already included, mock mode ON):

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_USE_MOCK=true
```

Set `VITE_USE_MOCK=false` to talk to the Express backend.

### Demo logins (mock mode)

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| User  | user@jobkavach.in   | User@123  |
| Admin | admin@jobkavach.in  | Admin@123 |

The login page also has one-click "Fill user / Fill admin" buttons in mock mode.

## What mock mode simulates

Everything runs in the browser, persisted to `localStorage` (`jk_mock_db_v1`). Run `resetMockDb()` in the browser console to start fresh.

- **Scans** – a rule-based analyser (`src/mocks/analyzer.js`) produces real, explainable results from whatever text you paste: red flags with the exact evidence, MCA check, domain/email check, entity extraction (UPI, phone, Telegram, links, amounts) matched against the scam database, scam stage and next-move warning, explanation in EN/HI/PA. The text tab has "Try a sample" chips.
- **Processing** – `scan:progress` → `scan:completed` events step by step (polling fallback also works).
- **Live monitor** – a Telegram task-scam chat arrives message by message; stage changes trigger a red toast, an alert beep and a browser notification. "Replay demo" restarts it.
- **Threat map** – a new `threat:new` item every ~5 s; counters, map tiles and the hourly chart update live.
- **Headlines** – publishing in Admin → Headlines updates the top ticker for everyone instantly; ~40 s after login the "info" headline is auto-published to show the live update.
- **Notifications** – scan results, stage changes, admin broadcasts and a periodic alert.

All names, UPI IDs, numbers and CINs in `src/mocks/` are sample data for the demo.

## Demo script (3 minutes)

1. Landing → **Scan a message now** → log in as user.
2. Scan → **Paste text** → "Telegram task scam" sample → **Analyse** → watch the 6 steps → result: verdict, stage tracker, next-move warning, click a red flag to highlight it in the text, **Listen** in Hindi, **Report** → copy / download PDF dossier.
3. **Live monitor** → watch the chat escalate stage by stage.
4. **Threat map** → live feed and counters.
5. Log out → log in as admin → **Admin → Headlines** → create a critical headline → it appears in the ticker immediately.
6. **Admin → Batch evaluation** → "Run on built-in sample set" → accuracy, precision, recall, F1, confusion matrix.

## Backend contract

Services in `src/services/` call these endpoints (each service switches to `src/mocks/handlers.js` in mock mode, which returns the same shapes):

- Auth: `POST /api/auth/register|login|logout`, `GET /api/auth/me` (httpOnly cookie; response is the user or `{ user }`)
- Scans: `POST /api/scans` (multipart `files[]`, `text`, `link`, `companyName`, `hrEmail`, `amountPaid`) → `{ scanId }`; `GET /api/scans/:id`; `GET /api/scans/:id/status` → `{ status: 'processing'|'completed'|'failed', step: 0–6 }`; `GET /api/scans?page&verdict&type&q&from&to` → `{ items, page, pages, total, hasMore }`; `DELETE /api/scans/:id`; `POST /api/scans/:id/feedback` `{ value: 'up'|'down' }`; `GET /api/scans/:id/report` (PDF blob)
- Uploads: `GET /api/uploads?page`
- Verify: `GET /api/verify/company?name`, `GET /api/verify/domain?domain`
- Live: `POST /api/live/connect-telegram` → `{ botUsername, deepLink, connected }`; `GET /api/live/sessions` → `{ connected, botUsername, deepLink, sessions[] }`
- Notifications: `GET /api/notifications`, `PATCH /api/notifications/read-all`
- Headlines: `GET /api/headlines/active`; admin `GET/POST/PUT/DELETE /api/admin/headlines`
- Stats: `GET /api/stats/threats` (public – also used on the landing page)
- Admin: `GET /api/admin/overview`, `GET|PATCH /api/admin/users`, `GET /api/admin/scans`, CRUD `/api/admin/entities`, `POST /api/admin/evaluate` → `{ results, metrics }`, `GET|POST /api/admin/broadcast`
- User: `PATCH /api/users/me`, `PATCH /api/users/me/password`, `DELETE /api/users/me`

The exact result object shape (verdict, score, track, stage, nextMove, redFlags[], company, domain, entities[], explanation `{en,hi,pa}`) is produced by `analyse()` in `src/mocks/analyzer.js` – mirror it on the backend.

Socket events the client listens for: `scan:progress {scanId, step}`, `scan:completed {scanId}`, `scan:failed {scanId, message}`, `live:message`, `live:stage_changed {stage, risk}`, `notification:new`, `headline:updated` (array of active headlines), `threat:new`. The client emits `live:start` / `live:stop` on the Live page.

## Design notes

- Light mode is the default; dark mode via the navbar toggle (persisted in `localStorage.theme`, flash-free via the inline script in `index.html`).
- Exact colour tokens are in `tailwind.config.js`; shared component classes (`.card`, `.btn-*`, `.input`, `.panel-*`, `.table`) are in `src/index.css`.
- The amber "warning" ticker uses navy text instead of white so it passes WCAG AA contrast.
- The India heatmap is a tile-grid cartogram (one equal tile per state) so small north-eastern states stay readable on phones.
- Call 1930 is always one tap away: floating button on mobile, sticky action bar on result pages, button in the navbar on wide screens.
- All visible text lives in `src/i18n/{en,hi,pa}.json`. The cybercrime dossier/PDF is always generated in English (portal language, Latin PDF fonts).
- For deployment on Vercel/Netlify add an SPA rewrite of all routes to `/index.html`.
