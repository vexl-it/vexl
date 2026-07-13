import {assertMigrationCryptoSupported} from '@vexl-next/cryptography/src/operations/deviceMigration/assertMigrationCryptoSupported'
import {generateRandomBase64Url} from '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes'
import {
  Sha256Hex,
  TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {bytesToHex} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  EraseCommandAccepted,
  SourceCancellationConfirmed,
  SourceErased,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Option, Schema} from 'effect'
import {Base64} from 'js-base64'
import {VexlLocalTransport} from '../../../../modules/vexl-local-transport'
import {reopenVexlRequests} from '../../../api/vexlHttpClientLayer'
import {unfreezeMmkvPersistence} from '../../atomUtils/mmkvMigrationRegistry'
import {
  readMigrationControlRecord,
  transitionMigrationControl,
} from '../controlStore'
import {
  deleteMigrationSecretsVerified,
  loadMigrationSecret,
  saveMigrationSecret,
} from '../controlStore/secrets'
import {
  createNativeTransportChannel,
  type TransportChannel,
} from '../protocol/channel'
import {
  createEncryptedProtocolChannel,
  type EncryptedProtocolChannel,
} from '../protocol/encryptedChannel'
import {
  createSingleUsePairingCapability,
  runSourceHandshake,
} from '../protocol/handshake'
import {
  createPairingQr,
  createSourceCancellationConfirmedQr,
  currentMigrationVersion,
  validateEraseCommandOnSource,
  type CreatedPairingQr,
} from '../protocol/qrGlue'
import {
  awaitDestinationActivated,
  awaitDestinationReceiptStored,
  awaitDestinationStaged,
  sendEraseCommandAccepted,
  sendSourceCancellationConfirmed,
  sendSourceErased,
  serveSnapshot,
} from '../protocol/sourceFlow'
import {createSnapshotExport} from '../snapshot/exporter'
import {enterSourceQuiescence} from './quiescence'
import {runSourceRetirement} from './retirement'

const error = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

export interface ActiveSourceSession {
  readonly pairing: CreatedPairingQr
  readonly channel: EncryptedProtocolChannel
}

function waitForInboundConnection(): Effect.Effect<
  TransportChannel,
  DeviceMigrationError
> {
  return Effect.async<TransportChannel, DeviceMigrationError>((resume) => {
    const unsubscribe = VexlLocalTransport.addConnectionAcceptedListener(
      (event) => {
        unsubscribe()
        // Attach data listeners before yielding back to the Effect runtime.
        // The peer may send ClientHello immediately after its connect promise
        // resolves, and native events emitted in this gap are not replayed.
        resume(
          Effect.succeed(
            createNativeTransportChannel({connectionId: event.connectionId})
          )
        )
      },
      () => {
        unsubscribe()
        resume(Effect.fail(error('transportFailed')))
      }
    )
    return Effect.sync(unsubscribe)
  })
}

/** Starts listener/pairing, confirms the human code, and persists QR keys. */
export function startSourceSession(args: {
  readonly confirmCode: Effect.Effect<boolean, never>
  readonly onPairingReady?: (pairing: CreatedPairingQr) => void
  readonly onHumanAuthCode?: (code: string) => void
  readonly onBothCodesConfirmed?: () => void
}): Effect.Effect<ActiveSourceSession, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    yield* _(
      Effect.tryPromise({
        try: assertMigrationCryptoSupported,
        catch: () => error('handshakeFailed'),
      })
    )
    const transferId = yield* _(
      Effect.tryPromise({
        try: async () =>
          Schema.decodeSync(TransferId)(await generateRandomBase64Url(32)),
        catch: () => error('handshakeFailed'),
      })
    )
    yield* _(enterSourceQuiescence(transferId))
    yield* _(
      Effect.tryPromise({
        try: VexlLocalTransport.startListener,
        catch: () => error('transportFailed'),
      })
    )
    const endpoints = yield* _(
      Effect.tryPromise({
        try: VexlLocalTransport.getLocalEndpointCandidates,
        catch: () => error('transportFailed'),
      })
    )
    if (endpoints.length === 0)
      return yield* _(Effect.fail(error('transportFailed')))
    const firstEndpoint = endpoints[0]
    if (firstEndpoint === undefined)
      return yield* _(Effect.fail(error('transportFailed')))
    const pairing = yield* _(
      createPairingQr({
        endpoints: [firstEndpoint, ...endpoints.slice(1)],
        transferId,
      })
    )
    args.onPairingReady?.(pairing)
    const transport = yield* _(waitForInboundConnection())
    yield* _(
      Effect.tryPromise({
        try: VexlLocalTransport.stopListener,
        catch: () => error('transportFailed'),
      })
    )
    const handshake = yield* _(
      runSourceHandshake({
        channel: transport,
        version: pairing.qrCode.version,
        transferId,
        pairingCapability: pairing.pairingCapability,
        ownKeyPair: pairing.sourceKeyPair,
        singleUse: createSingleUsePairingCapability(),
        confirmCode: args.confirmCode,
        onHumanAuthCode: args.onHumanAuthCode,
        onBothCodesConfirmed: args.onBothCodesConfirmed,
      })
    )
    yield* _(
      saveMigrationSecret('qrAuthTxKey')(
        Base64.fromUint8Array(handshake.keys.qrMacTxKey)
      )
    )
    yield* _(
      saveMigrationSecret('qrAuthRxKey')(
        Base64.fromUint8Array(handshake.keys.qrMacRxKey)
      )
    )
    yield* _(
      Effect.try({
        try: () => {
          const current = readMigrationControlRecord()
          if (current.mode !== 'sourceServing') throw error('stateInvalid')
          transitionMigrationControl(['sourceServing'], {
            ...current,
            pairingTranscriptDigest: Schema.decodeSync(Sha256Hex)(
              bytesToHex(handshake.transcriptHash)
            ),
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    const channel = yield* _(
      createEncryptedProtocolChannel({
        transport,
        streamTxKey: handshake.keys.streamTxKey,
        streamRxKey: handshake.keys.streamRxKey,
      })
    )
    return {pairing, channel}
  })
}

export function sendSourceSnapshotAndAwaitStaging(
  session: ActiveSourceSession
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const snapshot = yield* _(createSnapshotExport())
    yield* _(serveSnapshot(session.channel, snapshot))
    const current = readMigrationControlRecord()
    if (
      current.mode !== 'sourceServing' ||
      current.pairingTranscriptDigest === undefined
    )
      return yield* _(Effect.fail(error('stateInvalid')))
    const pairingTranscriptDigest = current.pairingTranscriptDigest
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['sourceServing'], {
            mode: 'sourceSnapshotSent',
            enteredAt: current.enteredAt,
            transferId: current.transferId,
            pairingTranscriptDigest,
            manifestDigest: snapshot.manifest.manifestDigest,
            snapshotContentDigest: snapshot.manifest.snapshotContentDigest,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    const staged = yield* _(
      awaitDestinationStaged(session.channel, {
        transferId: current.transferId,
        manifestDigest: snapshot.manifest.manifestDigest,
        snapshotContentDigest: snapshot.manifest.snapshotContentDigest,
      })
    )
    const sent = readMigrationControlRecord()
    if (sent.mode !== 'sourceSnapshotSent')
      return yield* _(Effect.fail(error('stateInvalid')))
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['sourceSnapshotSent'], {
            ...sent,
            mode: 'sourceAwaitingEraseCommand',
            stagingReceiptDigest: staged.stagingReceiptDigest,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
  })
}

export function safeCancelSource(
  channel?: EncryptedProtocolChannel
): Effect.Effect<string | undefined, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const record = readMigrationControlRecord()
    if (
      record.mode !== 'sourceQuiescing' &&
      record.mode !== 'sourceServing' &&
      record.mode !== 'sourceSnapshotSent' &&
      record.mode !== 'sourceAwaitingEraseCommand'
    )
      return yield* _(Effect.fail(error('stateInvalid')))
    let qrString: string | undefined
    if (record.mode === 'sourceAwaitingEraseCommand') {
      const txKey = yield* _(loadMigrationSecret('qrAuthTxKey'))
      if (Option.isNone(txKey))
        return yield* _(Effect.fail(error('stateInvalid')))
      const qr = yield* _(
        createSourceCancellationConfirmedQr({
          version: currentMigrationVersion,
          transferId: record.transferId,
          manifestDigest: record.manifestDigest,
          snapshotContentDigest: record.snapshotContentDigest,
          qrMacTxKey: Base64.toUint8Array(txKey.value),
        })
      )
      const encoded = qr.encodeToQrString()
      if (encoded._tag === 'Left') return yield* _(Effect.fail(encoded.left))
      qrString = encoded.right
      if (channel !== undefined)
        yield* _(
          sendSourceCancellationConfirmed(
            channel,
            new SourceCancellationConfirmed({
              sender: 'source',
              qrSchemaVersion: qr.qrSchemaVersion,
              version: qr.version,
              transferId: qr.transferId,
              manifestDigest: qr.manifestDigest,
              snapshotContentDigest: qr.snapshotContentDigest,
              cancellationNonce: qr.cancellationNonce,
              issuedAt: qr.issuedAt,
              mac: qr.mac,
            })
          )
        )
    }
    // Pairing cancellation can happen before an ActiveSourceSession exists,
    // while the native listener is still waiting for its first connection.
    // Always stop it best-effort so the next migration can bind a fresh port.
    yield* _(
      Effect.tryPromise({
        try: VexlLocalTransport.stopListener,
        catch: () => error('transportFailed'),
      }).pipe(Effect.ignore)
    )
    // Keep the source quiescent if secret deletion cannot be verified.
    yield* _(deleteMigrationSecretsVerified())
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl([record.mode], {mode: 'normal'})
        },
        catch: () => error('stateInvalid'),
      })
    )
    unfreezeMmkvPersistence()
    reopenVexlRequests()
    return qrString
  })
}

/** Persists irreversible commitment before any LAN acknowledgement. */
export function acceptEraseCommand(
  qrString: string,
  channel?: EncryptedProtocolChannel
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const record = readMigrationControlRecord()
    if (record.mode !== 'sourceAwaitingEraseCommand')
      return yield* _(Effect.fail(error('stateInvalid')))
    const rxKey = yield* _(loadMigrationSecret('qrAuthRxKey'))
    if (Option.isNone(rxKey))
      return yield* _(Effect.fail(error('stateInvalid')))
    const accepted = yield* _(
      validateEraseCommandOnSource({
        qrString,
        expected: {
          version: currentMigrationVersion,
          transferId: record.transferId,
          manifestDigest: record.manifestDigest,
          snapshotContentDigest: record.snapshotContentDigest,
          stagingReceiptDigest: record.stagingReceiptDigest,
        },
        qrMacRxKey: Base64.toUint8Array(rxKey.value),
        usedNonces: new Set(),
      })
    )
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['sourceAwaitingEraseCommand'], {
            ...record,
            mode: 'sourceRetirementCommitted',
            acceptedEraseCommandDigest: accepted.eraseCommandDigest,
            acceptedEraseCommandNonce: accepted.qrCode.commandNonce,
          })
          const readBack = readMigrationControlRecord()
          if (readBack.mode !== 'sourceRetirementCommitted')
            throw error('stateInvalid')
        },
        catch: () => error('stateInvalid'),
      })
    )
    if (channel !== undefined)
      yield* _(
        sendEraseCommandAccepted(
          channel,
          new EraseCommandAccepted({
            sender: 'source',
            transferId: record.transferId,
            eraseCommandDigest: accepted.eraseCommandDigest,
            commandNonce: accepted.qrCode.commandNonce,
          })
        )
      )
  })
}

/** Completes mandatory retirement and offers the persisted receipt over LAN. */
export function retireSourceAndOfferReceipt(
  channel?: EncryptedProtocolChannel
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const completed = yield* _(runSourceRetirement())
    if (channel === undefined) return
    const receipt = completed.sourceErasedReceipt
    // Retirement is already committed and the signed receipt is durable.
    // LAN acknowledgement is an optimization from this point on: any loss
    // falls back to scanning the receipt and must not cover it with an error.
    yield* _(
      Effect.gen(function* (_) {
        yield* _(
          sendSourceErased(
            channel,
            new SourceErased({
              sender: 'source',
              qrSchemaVersion: receipt.qrSchemaVersion,
              version: receipt.version,
              transferId: receipt.transferId,
              manifestDigest: receipt.manifestDigest,
              snapshotContentDigest: receipt.snapshotContentDigest,
              acceptedEraseCommandDigest: receipt.acceptedEraseCommandDigest,
              acceptedEraseCommandNonce: receipt.acceptedEraseCommandNonce,
              receiptNonce: receipt.receiptNonce,
              cleanupResultDigest: receipt.cleanupResultDigest,
              issuedAt: receipt.issuedAt,
              mac: receipt.mac,
            })
          )
        )
        const stored = yield* _(awaitDestinationReceiptStored(channel))
        if (
          stored.transferId !== completed.transferId ||
          stored.receiptNonce !== receipt.receiptNonce
        )
          return yield* _(Effect.fail(error('receiptInvalid')))
        const activated = yield* _(awaitDestinationActivated(channel))
        if (activated.transferId !== completed.transferId)
          return yield* _(Effect.fail(error('stateInvalid')))
        yield* _(
          Effect.try({
            try: () => {
              transitionMigrationControl(
                ['sourceErasedAwaitingDestinationAck'],
                {
                  mode: 'sourceComplete',
                  enteredAt: unixMillisecondsNow(),
                  transferId: completed.transferId,
                }
              )
            },
            catch: () => error('stateInvalid'),
          })
        )
      }).pipe(Effect.catchAll(() => Effect.void))
    )
  })
}
