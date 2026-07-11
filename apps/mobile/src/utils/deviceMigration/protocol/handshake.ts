import {
  deriveMigrationKeys,
  generateEphemeralKxKeyPair,
  type MigrationKeys,
  type MigrationKxKeyPair,
} from '@vexl-next/cryptography/src/operations/deviceMigration/keyExchange'
import {
  createQrMac,
  verifyQrMac,
} from '@vexl-next/cryptography/src/operations/deviceMigration/qrAuth'
import {sha256Bytes} from '@vexl-next/cryptography/src/operations/deviceMigration/sha256'
import {
  type PairingCapability,
  type TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {
  concatBytes,
  lengthPrefixed,
  u32be,
  utf8Encode,
} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {HANDSHAKE_INACTIVITY_TIMEOUT_MS} from '@vexl-next/domain/src/general/deviceMigration/limits'
import {
  ClientHello,
  HumanCodeConfirmed,
  PairingAccepted,
  PairingProof,
  SourceHello,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {
  exactVersionMatch,
  type VersionTriple,
} from '@vexl-next/domain/src/general/deviceMigration/version'
import {Effect, Either, Schema} from 'effect'
import {Base64} from 'js-base64'
import {type TransportChannel} from './channel'

const PROOF_DOMAIN = 'vexl-device-migration-pairing-proof-v1'

export interface HandshakeResult {
  readonly keys: MigrationKeys
  readonly humanAuthCode: string
  readonly transcriptHash: Uint8Array
}

export interface SingleUsePairingCapability {
  readonly consume: () => boolean
}

export function createSingleUsePairingCapability(): SingleUsePairingCapability {
  let used = false
  return {
    consume: () => {
      if (used) return false
      used = true
      return true
    },
  }
}

const fail = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

function sendPlaintext<A, I>(
  channel: TransportChannel,
  schema: Schema.Schema<A, I, never>,
  value: A
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.try({
    try: () => utf8Encode(Schema.encodeSync(Schema.parseJson(schema))(value)),
    catch: () => fail('schemaInvalid'),
  }).pipe(Effect.flatMap(channel.send))
}

function receivePlaintext<A, I>(
  channel: TransportChannel,
  schema: Schema.Schema<A, I, never>
): Effect.Effect<A, DeviceMigrationError> {
  return channel.nextFrame(HANDSHAKE_INACTIVITY_TIMEOUT_MS).pipe(
    Effect.flatMap((bytes) =>
      Effect.try({
        try: () => new TextDecoder().decode(bytes),
        catch: () => fail('handshakeFailed'),
      })
    ),
    Effect.flatMap((json) => {
      const decoded = Schema.decodeUnknownEither(Schema.parseJson(schema))(json)
      return Either.isRight(decoded)
        ? Effect.succeed(decoded.right)
        : Effect.fail(fail('handshakeFailed'))
    })
  )
}

/**
 * Capability proof construction.
 *
 * The QR capability is first reduced to a fixed 32-byte key with SHA-256.
 * That key authenticates a role-bound, length-prefixed transcript containing
 * the version, transfer id and both ephemeral public keys. The capability is
 * therefore proven without being repeated on the LAN, and field boundaries
 * cannot be confused. The full capability is independently mixed into the
 * final key derivation by deriveMigrationKeys.
 */
function pairingProofPayload(args: {
  readonly version: VersionTriple
  readonly transferId: TransferId
  readonly sourcePublicKey: string
  readonly destinationPublicKey: string
}): Uint8Array {
  return concatBytes(
    lengthPrefixed(utf8Encode(PROOF_DOMAIN)),
    lengthPrefixed(utf8Encode(args.version.appVersion)),
    u32be(args.version.migrationProtocolVersion),
    u32be(args.version.snapshotStorageSchemaVersion),
    lengthPrefixed(utf8Encode(args.transferId)),
    lengthPrefixed(utf8Encode('source')),
    lengthPrefixed(utf8Encode(args.sourcePublicKey)),
    lengthPrefixed(utf8Encode('destination')),
    lengthPrefixed(utf8Encode(args.destinationPublicKey))
  )
}

function capabilityProofKey(capability: PairingCapability): Uint8Array {
  return sha256Bytes(
    concatBytes(
      lengthPrefixed(utf8Encode(`${PROOF_DOMAIN}/key`)),
      lengthPrefixed(utf8Encode(capability))
    )
  )
}

function deriveKeys(args: {
  readonly role: 'source' | 'destination'
  readonly ownKeyPair: MigrationKxKeyPair
  readonly peerPublicKey: Uint8Array
  readonly transferId: TransferId
  readonly pairingCapability: PairingCapability
  readonly version: VersionTriple
}): Effect.Effect<MigrationKeys, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () =>
      await deriveMigrationKeys({
        role: args.role,
        ownKeyPair: args.ownKeyPair,
        peerPublicKey: args.peerPublicKey,
        transferId: args.transferId,
        pairingCapability: args.pairingCapability,
        protocolVersion: args.version.migrationProtocolVersion,
      }),
    catch: () => fail('handshakeFailed'),
  })
}

export function runDestinationHandshake(args: {
  readonly channel: TransportChannel
  readonly version: VersionTriple
  readonly transferId: TransferId
  readonly pairingCapability: PairingCapability
  readonly sourcePublicKey: Uint8Array
  readonly ownKeyPair?: MigrationKxKeyPair
  readonly confirmCode: Effect.Effect<boolean, never>
  readonly onHumanAuthCode?: (code: string) => void
}): Effect.Effect<HandshakeResult, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const ownKeyPair =
      args.ownKeyPair ??
      (yield* _(
        Effect.tryPromise({
          try: generateEphemeralKxKeyPair,
          catch: () => fail('handshakeFailed'),
        })
      ))
    const encodedOwnPublicKey = Base64.fromUint8Array(ownKeyPair.publicKey)
    const hello = yield* _(
      Effect.try({
        try: () =>
          Schema.decodeSync(ClientHello)({
            _tag: 'ClientHello',
            sender: 'destination',
            version: args.version,
            transferId: args.transferId,
            keyExchangePublicKey: encodedOwnPublicKey,
          }),
        catch: () => fail('handshakeFailed'),
      })
    )
    yield* _(sendPlaintext(args.channel, ClientHello, hello))
    const sourceHello = yield* _(receivePlaintext(args.channel, SourceHello))
    if (
      sourceHello.transferId !== args.transferId ||
      !exactVersionMatch(sourceHello.version, args.version) ||
      !bytesEqual(
        Base64.toUint8Array(sourceHello.keyExchangePublicKey),
        args.sourcePublicKey
      )
    )
      return yield* _(Effect.fail(fail('versionMismatch')))

    const proofBytes = pairingProofPayload({
      version: args.version,
      transferId: args.transferId,
      sourcePublicKey: sourceHello.keyExchangePublicKey,
      destinationPublicKey: hello.keyExchangePublicKey,
    })
    const mac = yield* _(
      Effect.tryPromise({
        try: async () =>
          await createQrMac(
            proofBytes,
            capabilityProofKey(args.pairingCapability),
            'destination'
          ),
        catch: () => fail('handshakeFailed'),
      })
    )
    const proof = yield* _(
      Effect.try({
        try: () =>
          Schema.decodeSync(PairingProof)({
            _tag: 'PairingProof',
            sender: 'destination',
            transferId: args.transferId,
            proof: Base64.fromUint8Array(mac),
          }),
        catch: () => fail('handshakeFailed'),
      })
    )
    yield* _(sendPlaintext(args.channel, PairingProof, proof))
    const accepted = yield* _(receivePlaintext(args.channel, PairingAccepted))
    if (accepted.transferId !== args.transferId)
      return yield* _(Effect.fail(fail('handshakeFailed')))

    const keys = yield* _(
      deriveKeys({
        role: 'destination',
        ownKeyPair,
        peerPublicKey: args.sourcePublicKey,
        transferId: args.transferId,
        pairingCapability: args.pairingCapability,
        version: args.version,
      })
    )
    args.onHumanAuthCode?.(keys.humanAuthCode)
    if (!(yield* _(args.confirmCode)))
      return yield* _(Effect.fail(fail('cancelled')))
    const confirmation = new HumanCodeConfirmed({
      sender: 'destination',
      transferId: args.transferId,
    })
    yield* _(sendPlaintext(args.channel, HumanCodeConfirmed, confirmation))
    const sourceConfirmation = yield* _(
      receivePlaintext(args.channel, HumanCodeConfirmed)
    )
    if (
      sourceConfirmation.sender !== 'source' ||
      sourceConfirmation.transferId !== args.transferId
    )
      return yield* _(Effect.fail(fail('roleInvalid')))
    return {
      keys,
      humanAuthCode: keys.humanAuthCode,
      transcriptHash: keys.transcriptHash,
    }
  }).pipe(Effect.tapError(() => args.channel.close().pipe(Effect.ignore)))
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false
  }
  return true
}

export function runSourceHandshake(args: {
  readonly channel: TransportChannel
  readonly version: VersionTriple
  readonly transferId: TransferId
  readonly pairingCapability: PairingCapability
  readonly ownKeyPair: MigrationKxKeyPair
  readonly singleUse: SingleUsePairingCapability
  readonly confirmCode: Effect.Effect<boolean, never>
  readonly onHumanAuthCode?: (code: string) => void
}): Effect.Effect<HandshakeResult, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const clientHello = yield* _(receivePlaintext(args.channel, ClientHello))
    if (clientHello.transferId !== args.transferId)
      return yield* _(Effect.fail(fail('handshakeFailed')))
    if (!exactVersionMatch(clientHello.version, args.version))
      return yield* _(Effect.fail(fail('versionMismatch')))
    const sourcePublicKey = Base64.fromUint8Array(args.ownKeyPair.publicKey)
    const sourceHello = yield* _(
      Effect.try({
        try: () =>
          Schema.decodeSync(SourceHello)({
            _tag: 'SourceHello',
            sender: 'source',
            version: args.version,
            transferId: args.transferId,
            keyExchangePublicKey: sourcePublicKey,
          }),
        catch: () => fail('handshakeFailed'),
      })
    )
    yield* _(sendPlaintext(args.channel, SourceHello, sourceHello))
    const proof = yield* _(receivePlaintext(args.channel, PairingProof))
    if (proof.transferId !== args.transferId)
      return yield* _(Effect.fail(fail('handshakeFailed')))
    const proofValid = yield* _(
      Effect.tryPromise({
        try: async () =>
          await verifyQrMac(
            Base64.toUint8Array(proof.proof),
            pairingProofPayload({
              version: args.version,
              transferId: args.transferId,
              sourcePublicKey,
              destinationPublicKey: clientHello.keyExchangePublicKey,
            }),
            capabilityProofKey(args.pairingCapability),
            'destination'
          ),
        catch: () => fail('handshakeFailed'),
      })
    )
    if (!proofValid) return yield* _(Effect.fail(fail('handshakeFailed')))
    // The QR becomes single-use only after an authenticated peer proves
    // possession. An unauthenticated LAN client must not be able to burn it.
    if (!args.singleUse.consume())
      return yield* _(Effect.fail(fail('handshakeFailed')))
    yield* _(
      sendPlaintext(
        args.channel,
        PairingAccepted,
        new PairingAccepted({
          sender: 'source',
          transferId: args.transferId,
        })
      )
    )
    const keys = yield* _(
      deriveKeys({
        role: 'source',
        ownKeyPair: args.ownKeyPair,
        peerPublicKey: Base64.toUint8Array(clientHello.keyExchangePublicKey),
        transferId: args.transferId,
        pairingCapability: args.pairingCapability,
        version: args.version,
      })
    )
    args.onHumanAuthCode?.(keys.humanAuthCode)
    const destinationConfirmation = yield* _(
      receivePlaintext(args.channel, HumanCodeConfirmed)
    )
    if (
      destinationConfirmation.sender !== 'destination' ||
      destinationConfirmation.transferId !== args.transferId
    )
      return yield* _(Effect.fail(fail('roleInvalid')))
    if (!(yield* _(args.confirmCode)))
      return yield* _(Effect.fail(fail('cancelled')))
    yield* _(
      sendPlaintext(
        args.channel,
        HumanCodeConfirmed,
        new HumanCodeConfirmed({
          sender: 'source',
          transferId: args.transferId,
        })
      )
    )
    return {
      keys,
      humanAuthCode: keys.humanAuthCode,
      transcriptHash: keys.transcriptHash,
    }
  }).pipe(Effect.tapError(() => args.channel.close().pipe(Effect.ignore)))
}
