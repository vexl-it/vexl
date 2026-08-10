# Backend Sentry error reporting

All Effect backend services report errors to Sentry through shared code in
`packages/server-utils`; the backoffice-app (Next.js) has its own setup in
`apps/backoffice-app/instrumentation.ts`.

## How it works

- `runMainInNode` builds a Sentry layer (`packages/server-utils/src/sentry.ts`)
  for every service. When `SENTRY_DSN` is unset, Sentry is disabled and the
  layer is a no-op.
- Errors-only: tracing stays on the existing OpenTelemetry setup
  (`skipOpenTelemetrySetup: true`, no `tracesSampleRate`). Sentry receives no
  spans and no breadcrumbs.
- Capture happens through an Effect logger that forwards every log at `Error`
  and `Fatal` level. All error funnels (`makeEndpointEffect`,
  `makeMiddlewareEffect`, `repeatingTask`, MQ consumers, `runMainInNode`) log
  unexpected errors there, so no per-callsite wiring is needed. **Logging at
  error level is the API for reporting to Sentry** — log expected/user-caused
  failures at warning or below.
- Events are grouped by error name + message + log message (not stack), because
  Effect tagged errors are constructed in shared helpers and stacks would
  collapse unrelated issues.
- Events are tagged with `trace_id`/`span_id` of the span active when the error
  was logged, so a Sentry event can be looked up in the tracing backend
  (Grafana/Tempo). Sentry itself receives no spans.

## Privacy

Vexl goes to great lengths to avoid collecting user data; error reporting must
not undermine that:

- Do not log tokens, keys, hashes, phone numbers, redis keys/values, or request
  payloads — not even at error level. Log stable identifiers (row ids, tags,
  counts) instead.
- As a safety net every event passes through
  `scrubSensitiveDataInPlace` (`packages/generic-utils/src/scrubSensitiveData.ts`),
  which drops values under sensitive-looking keys (token, secret, hash, ...) and
  scrubs PEM key blocks and E.164 phone numbers from strings.
- `sendDefaultPii` is off and breadcrumbs are dropped.

## Configuration

| Env var | Meaning |
| --- | --- |
| `SENTRY_DSN` | Per-service Sentry project DSN. Unset = disabled. |
| `NODE_ENV` | Used as the Sentry `environment`. |
| `SERVICE_VERSION` | Used as the Sentry `release` (git sha in CI builds). |

There is one Sentry project per service. Production/stage DSNs are injected by
the deployment manifests in the infrastructure repo. For local testing, set
`SENTRY_DSN` in `.env.local` (see `example.env.local`); it is injected into all
services, so everything lands in that one project.
