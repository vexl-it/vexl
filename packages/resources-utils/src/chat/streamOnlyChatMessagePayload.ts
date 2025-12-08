import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  StreamOnlyChatMessagePayload,
  StreamOnlyMessageCypher,
} from '@vexl-next/domain/src/general/messaging'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, pipe, Schema} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'
import {eciesDecryptE, eciesEncryptE} from '../utils/crypto'

const StreamOnlyChatMessagePayloadParsedJson = Schema.parseJson(
  StreamOnlyChatMessagePayload
)

export const encryptStreamOnlyChatMessagePayload = (
  payload: StreamOnlyChatMessagePayload,
  encryptWith: PublicKeyPemBase64
): Effect.Effect<StreamOnlyMessageCypher, ParseError | CryptoError> =>
  pipe(
    payload,
    Schema.encode(StreamOnlyChatMessagePayloadParsedJson),
    Effect.flatMap(eciesEncryptE(encryptWith)),
    Effect.flatMap(Schema.decode(StreamOnlyMessageCypher))
  )

export const decryptStreamOnlyChatMessageCypher = (
  cypher: StreamOnlyMessageCypher,
  decryptWith: PrivateKeyPemBase64
): Effect.Effect<StreamOnlyChatMessagePayload, ParseError | CryptoError> =>
  pipe(
    cypher,
    eciesDecryptE(decryptWith),
    Effect.flatMap(Schema.decode(StreamOnlyChatMessagePayloadParsedJson))
  )
