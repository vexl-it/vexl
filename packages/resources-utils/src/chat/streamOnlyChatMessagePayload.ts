import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  StreamOnlyChatMessagePayload,
  StreamOnlyMessageCypher,
} from '@vexl-next/domain/src/general/messaging'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, pipe, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {eciesDecryptE, eciesEncryptE} from '../utils/crypto'

const StreamOnlyChatMessagePayloadParsedJson = Schema.fromJsonString(
  StreamOnlyChatMessagePayload
)

export const encryptStreamOnlyChatMessagePayload = (
  payload: StreamOnlyChatMessagePayload,
  encryptWith: PublicKeyPemBase64
): Effect.Effect<StreamOnlyMessageCypher, SchemaError | CryptoError> =>
  pipe(
    payload,
    Schema.encodeEffect(StreamOnlyChatMessagePayloadParsedJson),
    Effect.flatMap(eciesEncryptE(encryptWith)),
    Effect.flatMap(Schema.decodeEffect(StreamOnlyMessageCypher))
  )

export const decryptStreamOnlyChatMessageCypher = (
  cypher: StreamOnlyMessageCypher,
  decryptWith: PrivateKeyPemBase64
): Effect.Effect<StreamOnlyChatMessagePayload, SchemaError | CryptoError> =>
  pipe(
    cypher,
    eciesDecryptE(decryptWith),
    Effect.flatMap(Schema.decodeEffect(StreamOnlyChatMessagePayloadParsedJson))
  )
