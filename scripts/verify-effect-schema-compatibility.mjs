import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(join(process.cwd(), "package.json"));
const effect = await import(pathToFileURL(require.resolve("effect")).href);
const { Schema, Option, HashMap } = effect.default ?? effect;
const load = (file) => import(pathToFileURL(join(process.cwd(), file)).href);
const notifications = await load(
  "packages/domain/src/general/notifications/index.ts",
);
const messaging = await load("packages/domain/src/general/messaging.ts");
const clubs = await load("packages/domain/src/general/clubs.ts");
const contacts = await load("packages/domain/src/general/contacts.ts");
const offers = await load("packages/domain/src/general/offers.ts");
const errors = await load("packages/domain/src/general/commonErrors.ts");
const { LoginChallengeRequestPayload } = await load(
  "packages/domain/src/general/loginChallenge.ts",
);
const { Uuid } = await load("packages/domain/src/utility/Uuid.brand.ts");
const { BooleanFromString } = await load(
  "packages/generic-utils/src/effect-helpers/BooleanFromString.ts",
);
const { parseUrlWithSearchParams } = await load(
  "packages/domain/src/utility/parseUrlWithSearchParams.ts",
);
const { getNextPageTokenSchema } = await load(
  "packages/generic-utils/src/base64NextPageTokenEncoding.ts",
);
const NumberFromString = require("effect/package.json").version.startsWith("3.")
  ? Schema.NumberFromString
  : (
      await load(
        "packages/generic-utils/src/effect-helpers/NumberFromString.ts",
      )
    ).NumberFromString;
function normalize(value) {
  if (typeof value === "number" && !Number.isFinite(value))
    return { number: String(value) };
  if (value === undefined) return { undefined: true };
  if (value === null || typeof value !== "object") return value;
  if (Option.isOption(value))
    return Option.isSome(value)
      ? { some: normalize(value.value) }
      : { none: true };
  if (HashMap.isHashMap(value)) return { entries: [...value].map(normalize) };
  if (value instanceof Date) return { date: value.toISOString() };
  if (Array.isArray(value)) return value.map(normalize);
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, normalize(value[key])]),
  );
}
const results = [];
function check(name, schema, inputs) {
  for (const [index, input] of inputs.entries()) {
    try {
      const decoded = Schema.decodeUnknownSync(schema)(input);
      let encoded;
      try {
        encoded = { value: normalize(Schema.encodeSync(schema)(decoded)) };
      } catch {
        encoded = { rejected: true };
      }
      results.push({ name, index, decoded: normalize(decoded), encoded });
    } catch {
      results.push({ name, index, rejected: true });
    }
  }
}
const optionalValues = [
  {},
  { value: undefined },
  { value: null },
  { value: "" },
  { value: 0 },
  { value: 123 },
  { value: "tracking-fixture" },
];
for (const [name, field] of Object.entries({
  tracking: notifications.ChatNotificationData.fields.trackingId,
  description: clubs.ClubInfo.fields.description,
  inactiveReason: clubs.ClubAdminInfo.fields.madeInactiveReason,
  lastRead: messaging.Chat.fields.lastMessageReadByOtherSideAt,
  isUnread: messaging.Chat.fields.isUnread,
  reportLimit: clubs.ClubInfo.fields.reportLimit,
}))
  check(name, Schema.Struct({ value: field }), optionalValues);
for (const field of ["location", "locationState"]) {
  check(
    "offer-" + field,
    Schema.Struct({ value: offers.OfferPublicPart.fields[field] }),
    optionalValues,
  );
}
check("locationState", offers.LocationStateToArray, [
  "ONLINE",
  "IN_PERSON",
  ["ONLINE"],
  ["ONLINE", "IN_PERSON"],
  [],
  null,
  ["INVALID"],
]);
check("number", NumberFromString, [
  "1",
  "0",
  "-2.3",
  "",
  " ",
  "foo",
  "1a",
  "0x10",
  "1e3",
  "NaN",
  "Infinity",
  "-Infinity",
  " 2 ",
]);
check("boolean", BooleanFromString, [
  "true",
  "false",
  "TRUE",
  "False",
  "",
  true,
  false,
  null,
  undefined,
]);
check("uuid", Uuid, [
  "00000000-0000-0000-0000-000000000000",
  "11111111-1111-4111-8111-111111111111",
  "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "11111111-1111-1111-8111-111111111111",
  "11111111-1111-7111-8111-111111111111",
  "bad",
]);
check("commonConnections", contacts.CommonConnectionsForUsers, [
  [],
  [["key", ["hash"]]],
  [["key", []]],
  {},
  null,
]);
check("chatNotification", notifications.ChatNotificationData, [
  { type: "MESSAGE", inbox: "fixture-inbox", sender: "fixture-sender" },
  { type: "NEW_FUTURE_TYPE", inbox: "fixture-inbox", sender: "fixture-sender" },
  {
    type: "MESSAGE",
    inbox: "fixture-inbox",
    sender: "fixture-sender",
    trackingId: "id",
    preview: "fixture",
  },
  {
    type: "MESSAGE",
    inbox: "fixture-inbox",
    sender: "fixture-sender",
    trackingId: null,
  },
  {},
]);
check(
  "url",
  parseUrlWithSearchParams(Schema.Struct({ page: NumberFromString })),
  [
    "https://example.com/path?page=2",
    "not a url",
    "https://example.com/path?page=bad",
  ],
);
const payload = {
  privateKey: "fixture-not-a-real-key",
  challenge: "fixture-challenge",
  validUntil: 1000,
};
check("loginChallenge", LoginChallengeRequestPayload, [
  Buffer.from(JSON.stringify(payload)).toString("base64"),
  "invalid",
  Buffer.from("{}").toString("base64"),
]);
check(
  "pagination",
  getNextPageTokenSchema(Schema.Struct({ lastId: Schema.String })),
  [
    Buffer.from(JSON.stringify({ lastId: "fixture" })).toString("base64url"),
    "!",
    "e30",
  ],
);
for (const name of [
  "NotFoundError",
  "UnexpectedServerError",
  "RateLimitedError",
]) {
  const fields =
    name === "RateLimitedError"
      ? { retryAfterMs: 5, rateLimitResetAtMs: 1000 }
      : {};
  try {
    results.push({
      name: "construct-" + name,
      value: normalize(new errors[name](fields)),
    });
  } catch {
    results.push({ name: "construct-" + name, rejected: true });
  }
}
if (process.argv.includes("--capture")) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const expected = JSON.parse(
    readFileSync(
      new URL("./fixtures/effect-v3-schema-contracts.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepStrictEqual(results, expected);
  console.log(
    `All ${results.length} schema cases match the Effect v3 baseline.`,
  );
}
