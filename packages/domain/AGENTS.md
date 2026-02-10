# AGENTS

Purpose: Domain schemas, value objects, and shared error types for Vexl services and clients.

Stack: TypeScript, `effect/Schema`.

Gotchas:

- If you add new errors or brands, update adopting services and the REST specs (`packages/rest-api`) as needed.
- Avoid embedding service-specific logic here; keep it domain-level only.
- Maintain backward compatibility -- schemas are consumed by multiple services and clients.
