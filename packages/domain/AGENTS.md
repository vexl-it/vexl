# AGENTS

Purpose: Domain schemas, value objects, and shared error types for Vexl services and clients.

Stack: TypeScript with `effect/Schema` for runtime validation; exports under `src/` for reuse across services and mobile.

Commands (root):

- `yarn workspace @vexl-next/domain lint|typecheck|format:fix`.
- Add tests when modifying schemas (no default test script, but prefer adding Jest if behavior changes).

Conventions:

- Keep domain models declarative with `Schema`/branded types; avoid duplicating DTO definitions elsewhere.
- Use shared error constructors (e.g., `UnexpectedServerError`, `NotFoundError`) to align backend behaviors.
- Maintain backward compatibility when adjusting schemas used by multiple services/clients.

Notes for agents:

- If you add new errors or brands, update adopting services and the REST specs as needed.
- Avoid embedding service-specific logic here; keep it domain-level only.
