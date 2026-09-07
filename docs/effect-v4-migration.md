# Effect v4 migration

Effect and the remaining `@effect/*` packages are pinned to `4.0.0-rc.112`. This is a release candidate. The migration follows the [Effect migration guide](https://github.com/Effect-TS/effect/blob/main/MIGRATION.md), with the installed release's APIs taking precedence where the guide differs.

The backend services, mobile app, dashboard, shared packages and tooling now use v4. Consolidated HTTP, RPC, SQL and socket modules come from `effect/unstable/*`. Backend tests run as native ESM. Mobile Jest transforms Effect, and Metro resolves its package exports. The lockfile contains one Effect version.

## Compatibility decisions

API and group middleware is registered **after endpoints and groups**. V4 middleware applies only to routes already registered; keeping the v3 order would remove existing protections. Dave explicitly approved changing this order and adding regression tests, with the decision documented in the PR. The HTTP compatibility script compares all 108 method/path/middleware records against the v3 baseline. Real HTTP tests verify missing and forged credentials are rejected, valid legacy and v2 signatures work, verified identity reaches handlers, and rate limits still block excess requests.

The notification RPC transport keeps decimal string request IDs and the deployed v3 terminal-message format. Mobile and backend can upgrade independently. A shared NDJSON adapter translates v3 cause trees to v4 cause arrays and preserves stream completion and interruption. The native Android client continues to use its existing string request ID. Tests cover captured v3 frames, the actual v4 client, framing, and both versions' codecs.

HTTP payload and response schemas accept the existing plain-object shapes. Header classes retain their computed getters. Missing authorization and User-Agent headers retain their old decoding behavior. Numeric parsing, optional fields, defaults and decoding fallbacks preserve the stored and wire representations tested by 113 baseline cases.

Grouped SQL resolvers explicitly recover an absent group to an empty array, preserving zero report counts and not-found responses. PostgreSQL unique violations use v4's typed reason to retain handled duplicate-UUID errors. Callback streams retain 16-item buffers and release their event listeners and workers when their scopes close.

## Verification

The final local run passed all 33 typecheck, format and lint tasks, all 18 test tasks (987 Jest tests and one websocket test), all 14 builds, and Android and iOS Hermes exports. Compatibility checks passed for 113 schema cases, 108 HTTP route protections and 15 cross-version RPC cases.

Run the repository gates from the root:

```sh
pnpm turbo:typecheck
pnpm turbo:format
pnpm turbo:lint
pnpm turbo:test
pnpm exec turbo build --concurrency=2
pnpm --filter @vexl-next/mobile-app exec expo export --platform ios --platform android --output-dir ../../.audit/effect-v4/mobile-export --max-workers 2
```

`turbo:test` runs the schema and HTTP baseline comparisons, checks API limit annotations, then runs the workspace tests. Database tests create a separate database per test file. Set `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_REDIS_URL` and `REDIS_URL` to dedicated test services. Turbo forwards these overrides. The test workflow provisions PostGIS and Redis.

The additional cross-version RPC check requires an installed checkout of baseline commit `396c92cb2906693fb157f0bf4525152431f9c851`:

```sh
pnpm exec tsx scripts/verify-effect-rpc-compatibility.mjs /path/to/v3-checkout
```

The migration used dedicated Docker containers with dynamically assigned loopback ports. It did not start repository Compose services or local dev servers. The existing worktree and other agents' environments were kept separate.

An existing Redis write without an expiry sends `PXAT -1` and fails against Redis; this was reproduced on the v3 baseline and left unchanged. The new Redis integration tests exercise explicit expiry, missing values, sets, pub/sub and listener cleanup. BullMQ coverage sends 64 jobs through the real queue, verifies backpressure and checks worker disposal. Dashboard websocket tests exercise real connections, ordered message delivery, cancellation and listener cleanup.

The [decision trail](effect-v4-decisions.tsv) records the migration checkpoints. Its `.audit/` references are local working artifacts. Intermediate diagnostics are working artifacts; the checked-in regression tests and baseline fixtures provide repeatable verification of the final behavior.
