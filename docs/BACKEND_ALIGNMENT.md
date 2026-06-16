# Backend alignment (UI contract vs live API)

This document records what the **QSwarm Web** client (`src/api/client.ts`, `src/api/schemas.ts`) expects, and how that compares to the public **Render** deployment **`https://qswarm.onrender.com`** as of the last OpenAPI check.

## What the UI implements today (control-plane v1)

With default env:

- **Origin:** `VITE_API_BASE_URL` (required in production when not mocking).
- **Path prefix:** `VITE_API_PATH_PREFIX` defaults to **`/api/v1`**.
- **Resources:** kebab-case segments such as `GET …/dashboard`, `GET …/repo-connections`, `GET …/sessions`, `POST …/sessions/:id/start`, etc. (full table in [README](../README.md)).

Responses are validated with **Zod** against camelCase TypeScript-friendly shapes in `src/api/schemas.ts`.

## What `https://qswarm.onrender.com` exposes (OpenAPI)

From `https://qswarm.onrender.com/openapi.json`:

| UI expectation | Live OpenAPI (summary) |
|----------------|-------------------------|
| Path prefix `/api/v1` | Routes are mounted at the **origin root** (e.g. `/repo-connections`, `/automation/sessions/...`). There is **no** `/api/v1` prefix on this deployment. |
| `GET /dashboard` | **Not present.** No aggregate dashboard endpoint. |
| `GET/PATCH /settings` | **Not present.** |
| `GET/POST /sessions`, session detail shape | **Different model.** Sessions live under **`/automation/sessions`** with different request/response schemas (e.g. create requires `approved_case_id`, `created_by`). |
| **List sessions** | **No** `GET /automation/sessions` collection list in OpenAPI (only `POST` create on that path). The UI’s sessions list cannot be populated from this spec alone. |
| `GET/POST /branch-policies` | Branch policy is scoped under **`/repo-connections/{connection_id}/branch-policy`** (not a global list resource). |
| `GET/POST /repo-connections` | **Exists**, but responses use **snake_case** and different field names (`owner_or_org`, `repo_name`, `credential_reference`, list wrapper `{ items: [...] }`, etc.). |

So: **pointing the UI at Render with only `VITE_API_BASE_URL` is not sufficient** for the screens to function end-to-end. You will typically see **HTTP 404** on `…/api/v1/dashboard` and similar, or **Zod validation errors** if a proxy returns the wrong JSON shape.

## Practical ways to integrate

1. **Compatibility API (recommended for this UI repo)**  
   Add a small **BFF** or extend the backend with routes that match the README contract (`/api/v1/...`, camelCase JSON, dashboard aggregation, session list, settings) and internally call the existing OpenAPI.

2. **Path-only adjustment**  
   Set `VITE_API_PATH_PREFIX` to **`""`** (empty) so requests hit the origin root — this fixes the **wrong prefix** only. You still need matching **paths and JSON** (or you will get 404 / schema errors).

3. **Fork the UI client**  
   Replace `src/api/schemas.ts` and `src/api/client.ts` to match the OpenAPI on Render (large change; different product semantics).

## CORS

See [CORS.md](./CORS.md). The browser must be allowed to call your API origin from the Vercel UI origin.
