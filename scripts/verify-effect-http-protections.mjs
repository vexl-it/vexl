import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HttpApi } from "effect/unstable/httpapi";

const expected = JSON.parse(
  readFileSync(
    new URL("./fixtures/effect-v3-http-protections.json", import.meta.url),
    "utf8",
  ),
);
const actual = [];
for (const service of [...new Set(expected.map((entry) => entry.service))]) {
  const module = await import(
    `../packages/rest-api/src/services/${service}/specification.ts`
  );
  const api = Object.entries(module).find(([name]) =>
    name.endsWith("ApiSpecification"),
  )?.[1];
  HttpApi.reflect(api, {
    onGroup: () => {},
    onEndpoint: ({ group, endpoint, middleware }) => {
      actual.push({
        service,
        group: group.identifier,
        endpoint: endpoint.identifier,
        method: endpoint.method,
        path: endpoint.path,
        middleware: [...middleware].map((tag) => tag.key).sort(),
      });
    },
  });
}
assert.deepEqual(actual, expected);
console.log(
  `Preserved authentication and rate-limit middleware for all ${actual.length} HTTP endpoints.`,
);
