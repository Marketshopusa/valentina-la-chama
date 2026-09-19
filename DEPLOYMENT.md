# Deployment Guide — Tu Persona Ideal

This app is a single Node process: an **Express server** (`server.ts`) that serves
a **Vite React SPA** and exposes the `/api/*` endpoints (chat, TTS, image/story
generation, and cross-device state). It is designed to run anywhere that can run
a long-lived Node server.

- **Runtime:** Node.js 22
- **Listens on:** `PORT` (default `3000`), `HOST` (default `0.0.0.0`)
- **Build output:** `dist/` (client) + `dist/server.cjs` (bundled server)

## 1. Environment variables

Copy `.env.example` to `.env` and fill it in. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes (for real AI) | Gemini chat, TTS voice, image/story generation. Without it the app runs in offline fallback mode. |
| `APP_URL` | No | Public URL of the deployment. |
| `KREA_API_KEY` | No | Krea-2 Turbo image/video generation. |
| `PORT` / `HOST` | No | Listen address (defaults `3000` / `0.0.0.0`). |
| `NODE_ENV` | Yes in prod | Set to `production` to serve the prebuilt client from `dist/`. |
| `STORAGE_PROVIDER` | No | `local` (default) or `firebase`. |
| `DATA_DIR` | No | Base dir for local JSON state (default `data`). |

**Never commit real secrets.** Use your platform's secret manager or a local
`.env` (git-ignored).

## 2. Choosing a storage backend

The app persists server-side state (shared app state, user profiles, image-engine
config, character anchors) and uploaded media. Pick one:

### `STORAGE_PROVIDER=local` (default)
JSON files under `DATA_DIR` + media under `public/uploads`. **Requires a
persistent disk.** Great for a VPS or any container with a mounted volume. On
ephemeral/serverless filesystems this data is lost between instances.

### `STORAGE_PROVIDER=firebase`
Firestore documents + Firebase Storage. **Stateless and cloud-friendly** — no
local disk needed. Requires a Google service account:

```
STORAGE_PROVIDER=firebase
FIREBASE_PROJECT_ID=nicol-ai
FIREBASE_STORAGE_BUCKET=nicol-ai.firebasestorage.app
FIRESTORE_DATABASE_ID=ai-studio-aacf2fdb-046e-4e1a-bc59-9db9cac5660b
# Provide ONE of the following credential sources:
FIREBASE_SERVICE_ACCOUNT_JSON={...service account JSON...}
# or
GOOGLE_APPLICATION_CREDENTIALS=/secrets/service-account.json
```

Create the service account in the Firebase console (Project settings → Service
accounts → Generate new private key) with Firestore + Storage access.

## 3. Local development

```bash
npm ci
cp .env.example .env   # then set GEMINI_API_KEY
npm run dev            # http://localhost:3000  (Vite middleware, HMR off)
```

## 4. Production without Docker

```bash
npm ci
npm run build
NODE_ENV=production node dist/server.cjs
```

## 5. Docker (recommended, portable)

Build and run with the provided `Dockerfile` / `docker-compose.yml`:

```bash
# with docker compose (persists data + uploads in named volumes)
cp .env.example .env    # set GEMINI_API_KEY (+ optional keys)
docker compose up --build
```

or plain Docker:

```bash
docker build -t tu-persona-ideal .
docker run -p 3000:3000 --env-file .env \
  -v tpi_data:/app/data -v tpi_uploads:/app/public/uploads \
  tu-persona-ideal
```

The image runs `node dist/server.cjs` with a `/api/health` healthcheck. Mount
volumes at `/app/data` and `/app/public/uploads` when using `STORAGE_PROVIDER=local`.

## 6. Platform notes

### Google Cloud Run
- Build with the Dockerfile; Cloud Run sets `PORT` automatically (the server
  already honors it).
- For persistence choose **`STORAGE_PROVIDER=firebase`** (recommended — Cloud Run
  instances are ephemeral), or attach a volume and use `local`.
- Put `GEMINI_API_KEY` and the Firebase credentials in Secret Manager.

### Railway / Render
- Deploy from the Dockerfile (or `npm ci && npm run build`, start
  `node dist/server.cjs`).
- Add a persistent disk mounted at `/app/data` + `/app/public/uploads` for
  `local`, or use `firebase`.
- Set env vars in the dashboard.

### VPS (e.g. DreamHost VPS / DreamCompute)
- Needs a Node-capable plan (shared PHP hosting will not run this server).
- `npm ci && npm run build`, then run `node dist/server.cjs` behind a process
  manager (systemd or pm2) and a reverse proxy (nginx) terminating TLS.
- `local` storage works directly on the VPS disk.

### Vercel
- Not a natural fit: this is a long-lived Express server, and Vercel's serverless
  filesystem is ephemeral. To use it you must run the API as serverless functions
  **and** set `STORAGE_PROVIDER=firebase`. Prefer one of the options above.

## 7. Health check

`GET /api/health` → `{ "status": "ok" }` — use it for readiness/liveness probes.
