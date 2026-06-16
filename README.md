# QSwarm Web

Production-style control surface for **QSwarm** QA orchestration: repository wiring, branch policies, sessions, reviews, and PR actions—without Postman or raw backend access.

> **Backend alignment:** The typed client targets a **specific REST contract** (`/api/v1/...`, camelCase models — see `src/api/schemas.ts`). The public host **`https://qswarm.onrender.com`** currently exposes a **different** OpenAPI surface (root paths, snake_case, no `GET /dashboard`, no session list, etc.). Read **[docs/BACKEND_ALIGNMENT.md](docs/BACKEND_ALIGNMENT.md)** before assuming “set `VITE_API_BASE_URL` and it works.” You may need a BFF or backend compatibility routes.

**Repo:** https://github.com/amiteshusf/Qswarm-UI

## Stack

- React 19, TypeScript, Vite 6  
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Base UI primitives)  
- React Router, TanStack Query, Zod, Framer Motion, Sonner  

## Quick start

```bash
npm install
npm run dev
```

Local development defaults to **mock data** via `.env.development` (`VITE_USE_MOCK_DATA=true`), so no backend is required.

## Environment model

| Mode | `VITE_USE_MOCK_DATA` | `VITE_API_BASE_URL` | Behavior |
|------|----------------------|---------------------|----------|
| **Dev mock** | `true` | ignored | In-memory mock store only; no HTTP. |
| **Dev real API** | `false` | required (e.g. `http://localhost:8080`) **or** use same-origin proxy | HTTP to `${VITE_API_BASE_URL}${prefix}/...` (see `VITE_API_PATH_PREFIX`). |
| **Dev same-origin API** | `false` | empty | Only if you proxy the configured prefix to the backend: set `VITE_ALLOW_SAME_ORIGIN_API=true`. |
| **Production** | `false` | **required** (e.g. `https://qswarm.onrender.com`) | HTTP to the hosted API. Empty base URL is **rejected** (no silent same-origin fallback on static hosting). |
| **Production + mock** | `true` | — | Allowed but a **warning banner** is shown; not recommended. |

### Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API **origin** only: scheme + host (+ optional port). **No trailing slash**, no `/api/v1` suffix. Example: `https://qswarm.onrender.com`. |
| `VITE_USE_MOCK_DATA` | `true` = mock store only. For production against the real API, set **`false`**. |
| `VITE_API_PATH_PREFIX` | Default **`/api/v1`**. Set to **empty** if your API has no version prefix (mounted at origin root). Never include a trailing slash. |
| `VITE_ALLOW_SAME_ORIGIN_API` | **Development only.** Set to `true` if you intentionally use a **relative** API base (proxy). Ignored for `import.meta.env.PROD`. |

Copy `.env.example` to `.env.local` and adjust.

### Vercel production checklist

1. Project → **Settings → Environment Variables** (Production):
   - `VITE_USE_MOCK_DATA` = `false`
   - `VITE_API_BASE_URL` = your API origin (example: `https://api.example.com`)
   - `VITE_API_PATH_PREFIX` = `/api/v1` unless your deployment uses root-mounted routes (see [docs/BACKEND_ALIGNMENT.md](docs/BACKEND_ALIGNMENT.md))
2. Redeploy after changing variables (Vite inlines env at build time).
3. Confirm the API allows **CORS** from your Vercel origin. See [docs/CORS.md](docs/CORS.md).
4. Open the app: there must be **no** red “API configuration” banner. If routes return 404, compare your server to this README contract ([docs/BACKEND_ALIGNMENT.md](docs/BACKEND_ALIGNMENT.md)).

### Local: real API

```bash
# .env.local
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://qswarm.onrender.com
```

### Local: mock (default)

`.env.development` sets `VITE_USE_MOCK_DATA=true`. Override in `.env.local` as needed.

## API contract (expected)

Full request URLs are `VITE_API_BASE_URL` + `VITE_API_PATH_PREFIX` (defaults to `/api/v1` if unset) + `/<resource>` from the table below.

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/dashboard` | Session counts + recent sessions |
| `GET` / `POST` | `/repo-connections` | List / create |
| `GET` / `PATCH` | `/repo-connections/:id` | Read / update |
| `GET` / `POST` | `/branch-policies` | List / create |
| `GET` / `PATCH` | `/branch-policies/:id` | Read / update |
| `GET` / `POST` | `/sessions` | List (optional `?status=`) / create |
| `GET` | `/sessions/:id` | Session detail |
| `POST` | `/sessions/:id/start` | |
| `POST` | `/sessions/:id/request-revision` | JSON body: `{ instruction, scope? }` |
| `POST` | `/sessions/:id/approve` | |
| `POST` | `/sessions/:id/create-pr` | |
| `GET` / `PATCH` | `/settings` | Read / partial update (UI is GET-only today) |

Responses should match the Zod schemas in `src/api/schemas.ts`. If your backend differs, update schemas and the client together.

## Errors and diagnostics

- **Configuration**: missing `VITE_API_BASE_URL` in production (with mock off) shows a top banner and fails fast instead of calling same-origin `/api/v1`.
- **Network / CORS**: surfaced with guidance to check the base URL and browser Network tab.
- **HTTP errors**: tries to parse `message`, `error`, `detail` (including FastAPI-style `detail` arrays) from JSON bodies.
- **Schema mismatch**: Zod failures indicate the response shape drifted from `src/api/schemas.ts`.

## Project layout

- `src/app/` — router, providers, theme  
- `src/api/` — client, Zod models, TanStack Query hooks, mocks, typed errors  
- `src/components/` — shadcn primitives, layout shell, reusable patterns  
- `src/features/` — route-level screens  

## Scripts

- `npm run dev` — Vite dev server  
- `npm run build` — typecheck + production bundle  
- `npm run preview` — serve `dist`  
- `npm run lint` — ESLint  

## Node

Use **Node 20.19+** or **22.12+** for the latest Vite toolchain; older patch releases may hit engine warnings.

## Deployment notes

- `vercel.json` adds a SPA fallback so client-side routes (e.g. `/sessions/:id`) resolve on refresh.
- The UI does **not** ship a server-side `/api` proxy; the browser talks directly to `VITE_API_BASE_URL`.
