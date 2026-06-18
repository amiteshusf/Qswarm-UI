/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK_DATA?: string
  /** Default `/api/v1`. Set to empty for APIs mounted at the origin root. */
  readonly VITE_API_PATH_PREFIX?: string
  /** Dev only: allow relative `/api/v1` when proxied locally. */
  readonly VITE_ALLOW_SAME_ORIGIN_API?: string
  /** Optional actor id merged into session mutation POST bodies when set. */
  readonly VITE_UI_ACTOR_ID?: string
  /** POST /sessions `createdBy` (default qswarm-web). */
  readonly VITE_SESSION_CREATED_BY?: string
  /** Override default product name "QSwarm" in nav and mock banner. */
  readonly VITE_APP_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
