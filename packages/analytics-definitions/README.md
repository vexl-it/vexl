# @vexl-next/analytics-definitions

Shared definitions for the privacy-aware frontend analytics described in `docs/analytics/system.md`. The mobile app produces states from these definitions, metrics-service validates uploads against them, and the dashboard reads them for labels and caps. The package depends on `effect` only.

## Rules

- Every payload field must be a bounded enum (`Schema.Literal`), a boolean, or a capped integer (`cappedCounter(max)`). Never a timestamp, a free number, a free string, or any id.
- Journeys longer than 7 days carry booleans and enums only and round `updatedDay` to the ISO week (`updatedDayPrecision: 'week'`), never below `startDay` (`updatedDayFor` in `src/buckets.ts`).
- Durations and counts are bucketed on the device with the helpers in `src/buckets.ts`; only the bucket is uploaded.
- All calendar helpers are UTC.
- Main / Club classification of core actions lives in `src/coreAction.ts`; signal sites and the activity aggregations use it instead of their own rules.

## Adding a definition

1. Create `src/definitions/<name>.ts` with `defineJourney` or `defineAggregation`.
2. Add it to `analyticsDefinitions` in `src/definitions/index.ts` (the server allow-list) and export it from `src/index.ts`.
3. Describe it in `docs/analytics/definitions.md`.
4. Changing a payload schema bumps `schemaVersion`; the server accepts exactly one version per name.

## Tests

`src/registry.test.ts` decodes a sample payload for every registered definition, so a new definition needs a sample there. Transport and storage tests do not depend on the real definitions: they mock `src/definitions/index.ts` with `src/testDefinitions.ts` (`jest.mock` in mobile tests and in `apps/metrics-service/jest.afterenv.ts`).
