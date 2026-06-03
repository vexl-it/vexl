Purpose: Monorepo for Vexl mobile app, backend services, and shared tooling. Vexl mobile app is peer to peer bitcoin marketplace that allows users to trade bitcoin within their social network (based on imported phonen number contacts).

## Imporant principles

Vexl takes user privacy seriously. It's very important, to the core of our mission, that we minimize the amount of user data we collect and store. This means that most of the information we store on the server db is stored encrypted by client - such as offer content or user profiles. Whenever we add a new feature we need to keep this in mind. We go great lenghts to make sure that we can never access our users data and reveal their identity - so we don't store phone numbers in plaintext and we consider clearly what metadata we report and store to backend so we avoid backend being able to link user activity to real world identities. We want our users to feel safe without having to trust us. This is a core principle of our product and we need to keep it in mind when designing new features and implementing them!

You - the coding agent - are expected to bring up any concerns about user privacy and data security - as described above - whenever you think a new feature or implementation might have implications for those. If you see a potential risk, please STOP what you are doing, raise it and we can discuss how to mitigate it - unless clearly and undisputedly told othewise!

## code style

It's always better to remove code than to add a new code. If you see an oportunity to make something simpler or remove code that is no longer used do it!

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

When changing any UI / UX in the mobile app or in the ui package you must read @docs/ui_coding_guideline.md and follow the guidelines described there!

- **NEVER use the `as` keyword in TypeScript.** Use `Schema.decodeUnknown` to validate external data via `effect/Schema`.
- HTTP services: build on `HttpApiBuilder` + `Layer`; reuse helpers from `packages/server-utils`. Keep schemas/types in shared packages.
- Prefer Effect `Array` helpers with `pipe` over native array methods (`filter`, `map`, etc.). Use `Array.isNonEmptyArray` for emptiness checks.
- Define custom errors by extending `Schema.TaggedError` (for example `class MyError extends Schema.TaggedError<MyError>(...)`) instead of extending `Error`, to keep error handling consistent across the codebase.

## packages roles
- apps/-*service - backend services
- apps/mobile - Expo mobile app
- packages/server-utils - shared utilities for backend services
- packages/ui - shared UI components and themes for mobile app
- packages/domain - shared domain logic, types, schemas, and similar for both backend and mobile app
- packages/cryptography - shared cryptography utilities for both backend and mobile app
- packages/generic-utils - shared generic utilities for both backend and mobile app - should not depend on any of the other vexl packages
- packages/localization - shared localization utilities, types, and similar for both backend and mobile app
- packages/resources-utils - shared utilities for handling offers, chat, and other "resources" operations
- packages/rest-api - effect-ts based rest api definitions and client for both backend and mobile app
- tooling/* - shared tooling for the repo (esling, prettier, etc...)

## Verification
IMPORTANT -- Verification steps (do this to verify your code changes. Not all bugs / errors will be caught by CI, but the most obvious ones will):
1. Run `yarn turbo:typecheck` in the affected workspace. Read the output and fix all errors.
2. Run `yarn turbo:format`. If it fails, run `yarn turbo:format:fix` first, then re-run.
3. Run `yarn turbo:lint`. Fix any errors.
4. Do NOT consider your work done until all three pass cleanly.
