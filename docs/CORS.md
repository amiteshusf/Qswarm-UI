# Browser (CORS) expectations for QSwarm Web

This repository is a **static SPA**. All API calls run in the browser. When `VITE_API_BASE_URL` points at a separate host (for example `https://qswarm.onrender.com`), that host must allow cross-origin requests from the UI origin.

## What the backend must allow

- **Origin**: the deployed Vercel URL (for example `https://qswarm-ui.vercel.app`) and any preview deployment origins you use.
- **Methods**: at least `GET`, `POST`, `PATCH`, `OPTIONS`.
- **Headers**: at least `Content-Type` (and any auth headers you add later).
- **Routes**: the UI calls `${VITE_API_BASE_URL}` + `${VITE_API_PATH_PREFIX}` (default `/api/v1`) + `/<resource>` — see README API table and [BACKEND_ALIGNMENT.md](./BACKEND_ALIGNMENT.md).

If CORS is misconfigured, the browser typically shows a failed network request with little response body. The UI surfaces this as **“Cannot reach the API”** with a reminder to check CORS in DevTools → Network.

## Same-origin deployments

Production builds **require** `VITE_API_BASE_URL` whenever mock mode is off, including if the API is served from the same hostname as the UI. Set the base URL to that shared origin (for example `https://app.example.com`) so requests are explicit—not an accidental empty default on static hosting.

If you use a **path-based** reverse proxy on the same host, the browser still issues requests to that origin; ensure `${VITE_API_BASE_URL}/api/v1/...` reaches your API.
