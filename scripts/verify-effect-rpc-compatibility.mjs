import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { Cause, Exit, Schema } from "effect";
import { Rpc, RpcSerialization } from "effect/unstable/rpc";
import { notificationRpcSerialization } from "../packages/rest-api/src/services/notification/rpcSerialization.ts";

if (!process.argv[2])
  throw new Error("Pass the path to an installed Effect v3 baseline checkout");
const baseline = createRequire(resolve(process.argv[2], "package.json"));
const { Cause: C3, Exit: X3, FiberId: F3, Schema: S3 } = baseline("effect");
const R3 = baseline("@effect/rpc/Rpc");
const legacyCodec = R3.exitSchema(
  R3.make("wire", { success: S3.String, error: S3.String, stream: true }),
);
const modernCodec = RpcSerialization.ndjson.codecFor(
  Rpc.exitSchema(
    Rpc.make("wire", {
      success: Schema.String,
      error: Schema.String,
      stream: true,
    }),
  ),
);
const modernExits = [
  Exit.void,
  Exit.fail("failure"),
  Exit.die("defect"),
  Exit.interrupt(12),
  Exit.interrupt(),
  Exit.failCause(Cause.empty),
  Exit.failCause(Cause.combine(Cause.fail("first"), Cause.fail("second"))),
];
const legacyExits = [
  X3.void,
  X3.fail("failure"),
  X3.die("defect"),
  X3.interrupt(F3.runtime(12, 0)),
  X3.interrupt(F3.none),
  X3.interrupt(F3.composite(F3.runtime(12, 0), F3.runtime(13, 0))),
  X3.failCause(C3.empty),
  X3.failCause(C3.parallel(C3.fail("first"), C3.fail("second"))),
];
const parser = notificationRpcSerialization.makeUnsafe();
for (const exit of modernExits) {
  const encoded = Schema.encodeSync(modernCodec)(exit);
  const wire = parser.encode({ _tag: "Exit", requestId: "1", exit: encoded });
  const legacyMessage = JSON.parse(wire);
  S3.decodeUnknownSync(legacyCodec)(legacyMessage.exit);
  assert.deepEqual(parser.decode(wire)[0].exit, encoded);
}
for (const exit of legacyExits) {
  const wire =
    JSON.stringify({
      _tag: "Exit",
      requestId: "1",
      exit: S3.encodeSync(legacyCodec)(exit),
    }) + "\n";
  const message = parser.decode(wire)[0];
  const decoded = Schema.decodeUnknownSync(modernCodec)(message.exit);
  const roundTrip = parser.encode({
    _tag: "Exit",
    requestId: "1",
    exit: Schema.encodeSync(modernCodec)(decoded),
  });
  S3.decodeUnknownSync(legacyCodec)(JSON.parse(roundTrip).exit);
}
console.log(
  `All ${modernExits.length + legacyExits.length} RPC terminal cases interoperate with the actual Effect v3 codec.`,
);
