# QSwarm Web

Production-style control surface for **QSwarm** QA orchestration: repository wiring, branch policies, sessions, reviews, and PR actions—without Postman or raw backend access.

## Stack

- React 19, TypeScript, Vite 6  
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Base UI primitives)  
- React Router, TanStack Query, Zod, Framer Motion, Sonner  

## Quick start

```bash
npm install
npm run dev
```

Local development uses **mock data** via `.env.development` (`VITE_USE_MOCK_DATA=true`). Remove or override that file to exercise a real API.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Optional. Origin of the QSwarm HTTP API **without** a trailing slash. When unset, the client calls same-origin paths under `/api/v1/...` (useful behind a reverse proxy). |
| `VITE_USE_MOCK_DATA` | When `true`, all requests use the in-browser mock store (no network). |

Copy `.env.example` to `.env.local` and adjust.

## API contract (expected)

The typed client in `src/api/client.ts` targets REST-style resources under:

`${VITE_API_BASE_URL}/api/v1/...` (or `/api/v1/...` when the base URL is empty)

| Method | Path | Notes |
|--------|------|--------|
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
| `GET` / `PATCH` | `/settings` | Read / partial update |

Responses should match the Zod schemas in `src/api/schemas.ts`. If your backend differs, update schemas and the client together.

## Project layout

- `src/app/` — router, providers, theme  
- `src/api/` — client, Zod models, TanStack Query hooks, mocks  
- `src/components/` — shadcn primitives, layout shell, reusable patterns  
- `src/features/` — route-level screens  

## Scripts

- `npm run dev` — Vite dev server  
- `npm run build` — typecheck + production bundle  
- `npm run preview` — serve `dist`  
- `npm run lint` — ESLint  

## Node

Use **Node 20.19+** or **22.12+** for the latest Vite toolchain; older patch releases may hit engine warnings.
