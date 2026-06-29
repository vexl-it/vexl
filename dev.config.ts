/**
 * dev.config.ts — the single, committed, NON-SECRET source of truth for local
 * development. Read by BOTH `dev:backend` (tooling/dev/dev-backend.ts) and
 * `dev:mobile` (owned by the mobile tooling).
 *
 * Nothing secret belongs here. Genuinely-secret or machine-specific values live
 * in the gitignored `.env.local` (see `example.env.local`) and OVERRIDE anything
 * in this file at runtime.
 *
 * See docs/dev-tooling-spec.md for the full design.
 */

// ---------------------------------------------------------------------------
// DEV-ONLY crypto keys
// ---------------------------------------------------------------------------
// !!! DEV ONLY — never reused in staging/prod. !!!
// These were FRESHLY generated for local development only, using the project's
// own cryptography package so they match exactly the formats the services
// expect to decode (see packages/cryptography/src/KeyHolder).
//
// How they were generated (one-off, committed on purpose so the core stack
// needs zero secret setup):
//   - SECRET_PRIVATE_KEY / SECRET_PUBLIC_KEY: ECDSA (secp256k1) keypair via
//     `generatePrivateKey()` from @vexl-next/cryptography/src/KeyHolder.
//     Format: base64-encoded PEM (PrivateKeyPemBase64 / PublicKeyPemBase64).
//   - LIBSODIUM_PRIVATE_KEY: ed25519 secret key via `generateKeyPair()` from
//     @vexl-next/cryptography/src/operations/cryptobox. Format: PrivateKeyV2
//     ("V2_PRIV_" + base64url(secret key)).
//   - SECRET_EAS_KEY: 32 random bytes, base64.
//   - SECRET_SALT_FOR_SERVER_CONTACTS: 24 random bytes, hex.
//
// SECRET_HMAC_KEY is intentionally NOT random — see the note below.
export const devCryptoKeys = {
  SECRET_PUBLIC_KEY:
    "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVVSzBQV0pIV28wZUI5WUZ4MzhnOFZ5NWttdGphaS8yYwpCbUh1cDkxbTJ5NWVwSkVEMU1XWDcwNW9NZW15MDNwcXlSNEZtbWZNZElQN3hsUUhZRHBaQmc9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K",
  SECRET_PRIVATE_KEY:
    "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0VBZ0VBTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFLQkcwd2F3SUJBUVFnTDQySVlJUzhaYVpTZG5yeitaK0EKM2xTRHdwK2pTNnIyL1E5QVl0MFBSK3loUkFOQ0FBUlFyUTlZa2RhalI0SDFnWEhmeUR4WExtU2EyTnFML1p3RwpZZTZuM1diYkxsNmtrUVBVeFpmdlRtZ3g2YkxUZW1ySkhnV2FaOHgwZy92R1ZBZGdPbGtHCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K",
  LIBSODIUM_PRIVATE_KEY:
    "V2_PRIV_e6VB7VWrPsxLDAmGIGjLJLG18wFoH5TFeuD2SMY5C3tauKM71gYfp_1008PuHo0KTA1460ti5opAP2lluWcSCg",
  SECRET_EAS_KEY: "ewsCJPUymc0+n3DJrM9tblZQej9TfQYGBwbADCh7QlU=",
  SECRET_SALT_FOR_SERVER_CONTACTS:
    "c71aa220a18c579b7f8b1f9e3ba990611fc2be694d600a4c",

  // !!! MOBILE ALIGNMENT REQUIRED !!!
  // SECRET_HMAC_KEY is the key the backend uses to HMAC-hash phone numbers. For
  // end-to-end local login to work, the mobile `local` preset's `hmacPassword`
  // (apps/mobile/app.config.ts -> presets.local.hmacPassword) MUST equal this
  // value. It is currently hardcoded to 'VexlVexl' on the mobile side, so this
  // is pinned to 'VexlVexl' to keep the two in sync out of the box. The mobile
  // tooling owns keeping the app side aligned to this value.
  SECRET_HMAC_KEY: "VexlVexl",
};

// Public counterpart of LIBSODIUM_PRIVATE_KEY (derived at generation time).
// Not consumed by the backend env; exported for the mobile tooling / debugging.
export const devLibsodiumPublicKey =
  "V2_PUB_WrijO9YGH6f9dNPD7h6NCkwNeOtLYuaKQD9pZblnEgo";

// ---------------------------------------------------------------------------
// Port map (defaults — every one overridable via .env.local on conflicting
// machines; see tooling/dev/dev-backend.ts which honors *_PORT overrides).
// ---------------------------------------------------------------------------
export const ports = {
  // Backend services
  userService: 3001,
  contactService: 3002,
  offerService: 3003,
  chatService: 3004,
  locationService: 3005,
  notificationService: 3006,
  btcExchangeRateService: 3007,
  feedbackService: 3008,
  contentService: 3009,
  metricsService: 3010,

  // Web apps
  backofficeApp: 3011,
  accountDeletionWebsite: 3012,
  dashboardClient: 3013,
  dashboardUpdates: 3014,
  dashboardSocket: 3015,
  dashboardHealth: 3016,
  // Vite dev server that serves the dashboard UI (its default port). The client
  // proxies /websocket -> dashboardSocket. Served by the dashboard `dev` script.
  dashboardUi: 5173,

  // Infra
  postgres: 5432,
  redis: 6379,
  minioApi: 9000,
  minioConsole: 9001,

  // Observability
  grafana: 3030,
  loki: 3100,
  tempo: 3200,
  tempoOtlpHttp: 4318,
  tempoOtlpGrpc: 4317,

  // Mobile
  metro: 8081,
};

// Health-server ports for the 10 backend services. Each service exposes a tiny
// `ok` HTTP endpoint on its HEALTH_PORT (see packages/server-utils HealthServer).
// Convention: service port + 5000 (3001 -> 8001 ... 3010 -> 8010).
export const healthPorts = {
  userService: 8001,
  contactService: 8002,
  offerService: 8003,
  chatService: 8004,
  locationService: 8005,
  notificationService: 8006,
  btcExchangeRateService: 8007,
  feedbackService: 8008,
  contentService: 8009,
  metricsService: 8010,
};

// ---------------------------------------------------------------------------
// Postgres — one database per service (see spec §5.1). The compose init script
// creates each of these.
// ---------------------------------------------------------------------------
export const dbNames = {
  user: "user",
  contact: "contact",
  offer: "offer",
  chat: "chat",
  content: "content",
  feedback: "feedback",
  metrics: "metrics",
  notification: "notification",
  // backoffice-app's own db; dashboard-app connects read-only to `contact`.
  backoffice: "backoffice",
};

// ---------------------------------------------------------------------------
// Infra connection defaults (NON-SECRET — local docker only).
// ---------------------------------------------------------------------------
export const infra = {
  host: "localhost",
  postgres: {
    user: "postgres",
    password: "root",
  },
  redis: {
    // Shared by all queue producers/consumers — must match for BullMQ metrics.
    namespacePrefix: "vexl_dev",
    metricsQueueName: "dev-metrics-queue",
  },
  minio: {
    // MinIO root creds double as the S3 (AWS SDK) creds locally.
    rootUser: "vexl",
    rootPassword: "vexl-local-secret",
    bucket: "vexl-resources",
    region: "eu-west-1",
  },
};

// ---------------------------------------------------------------------------
// Common runtime values shared by every backend node process.
// ---------------------------------------------------------------------------
export const common = {
  NODE_ENV: "development",
  // Structured JSON logs so Loki/Grafana parse them into fields. Decoupled from
  // NODE_ENV so we keep dev behavior (rate limiting off, dev tools on).
  LOG_FORMAT: "json",
  SERVICE_VERSION: "local",
  // Metrics are noisy and need the full pipeline; off by default in dev.
  DISABLE_METRICS: "true",
  OTLP_TRACE_EXPORTER_URL: `http://${infra.host}:${ports.tempoOtlpHttp}/v1/traces`,
};

// ---------------------------------------------------------------------------
// Inter-service URLs, derived from the port map (spec §3.1).
// ---------------------------------------------------------------------------
export const internalUrls = {
  // user-service redirects feedback submissions to feedback-service.
  feedbackService: `http://${infra.host}:${ports.feedbackService}`,
  // location-service redirects exchange-rate lookups to btc-exchange-rate-service.
  btcExchangeRateService: `http://${infra.host}:${ports.btcExchangeRateService}`,
  // backoffice-app proxies admin calls to contact/content services.
  contactService: `http://${infra.host}:${ports.contactService}`,
  contentService: `http://${infra.host}:${ports.contentService}`,
};

// ---------------------------------------------------------------------------
// Dummy login (spec §3.1 / Decision §10.5). With LOGIN_CODE_DUMMY_FOR_ALL set,
// any phone number gets this static code and NO SMS provider is ever called.
// VERIFICATION_PROVIDER + PRELUDE_API_TOKEN are required-at-boot strings in
// user-service but are unused on the dummy path, hence the placeholder token.
// Set a real PRELUDE_API_TOKEN in .env.local (and unset LOGIN_CODE_DUMMY_FOR_ALL)
// to enable real SMS OTP.
// ---------------------------------------------------------------------------
export const dummyLogin = {
  LOGIN_CODE_DUMMY_FOR_ALL: "222222",
  VERIFICATION_PROVIDER: "prelude",
  PRELUDE_API_TOKEN: "dummy-dev-token",
};

// ---------------------------------------------------------------------------
// Per-service business/feature constants (ported from the old devConfig.ts).
// Numbers/booleans are stringified into env by the env builder.
// ---------------------------------------------------------------------------
export const serviceConstants = {
  userService: {
    REREQUEST_LIMIT_DAYS: 1,
  },
  chatService: {
    REQUEST_TIMEOUT_DAYS: 30,
    MESSAGE_EXPIRATION_LOWER_LIMIT_DAYS: 7,
    MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS: 90,
  },
  offerService: {
    EXPIRATION_PERIOD_DAYS: 30,
    OFFER_REPORT_FILTER: 3,
    REPORT_LIMIT_INTERVAL_DAYS: 7,
    REPORT_LIMIT_COUNT: 5,
  },
  contactService: {
    INACTIVITY_NOTIFICATION_AFTER_DAYS: 30,
    NEW_CONTENT_NOTIFICATION_AFTER_DAYS: 7,
    INITIAL_IMPORT_CONTACTS_COUNT_QUOTA: 500,
    IMPORT_CONTACTS_COUNT_QUOTA: 100,
    IMPORT_CONTACTS_RESET_AFTER_DAYS_QUOTA: 7,
    // Dev admin token hash (sha256 of a dev admin token). Non-secret dev value.
    ADMIN_TOKEN_HASH: "7yYOmqPGc68kDReiZgSANhqOCB0f/soqXtDjIZ/BhWc=",
    CLUB_LINK_TEMPLATE: "vexl://club/{code}",
    CLUB_REMOVE_AFTER_MARKED_AS_DELETED_DAYS: 30,
    CLUB_MEMBER_EXPIRATION_AFTER_DAYS_OF_INACTIVITY: 90,
    CLUB_REPORT_LIMIT_INTERVAL_DAYS: 7,
    CLUB_REPORT_LIMIT_COUNT: 5,
    APP_VERSION_SUPPORTING_V2_KEYS: 710,
    CONTACT_ACTIVE_WINDOW_DAYS: 90,
  },
  contentService: {
    ADMIN_TOKEN_HASH: "7yYOmqPGc68kDReiZgSANhqOCB0f/soqXtDjIZ/BhWc=",
    FORCE_UPDATE_FOR_VERSION_AND_LOWER: 0,
    APP_IN_MAINTENANCE_MODE: false,
    VEXL_BLOG_URL_TEMPLATE: "https://vexl.it/post/{slug}",
  },
  backofficeApp: {
    ADMIN_TOKEN_HASH: "7yYOmqPGc68kDReiZgSANhqOCB0f/soqXtDjIZ/BhWc=",
  },
};

// ---------------------------------------------------------------------------
// Mobile defaults (minimal — the mobile tooling reads these). Kept here so the
// app and backend share one source of truth for ports/host.
// ---------------------------------------------------------------------------
export const mobile = {
  defaultPlatform: "ios",
  // 'local' | 'staging' | '<host>' — see spec §8.
  defaultBackend: "local",
  metroPort: ports.metro,
};

const devConfig = {
  devCryptoKeys,
  devLibsodiumPublicKey,
  ports,
  healthPorts,
  dbNames,
  infra,
  common,
  internalUrls,
  dummyLogin,
  serviceConstants,
  mobile,
};

export type DevConfig = typeof devConfig;

export default devConfig;
