import {assertMigrationCryptoSupported} from '@vexl-next/cryptography/src/operations/deviceMigration/assertMigrationCryptoSupported'
import {bytesToHex} from '@vexl-next/domain/src/general/deviceMigration/encoding'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  DestinationActivated,
  DestinationReceiptStored,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {
  SourceCancellationConfirmedQrCode,
  SourceErasedReceiptQrCode,
} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Option, Schema} from 'effect'
import {reloadAppAsync} from 'expo'
import {getDefaultStore} from 'jotai'
import {Base64} from 'js-base64'
import {VexlLocalTransport} from '../../../../modules/vexl-local-transport'
import {withAllowedVexlOperations} from '../../../api/vexlHttpClientLayer'
import {isSessionV2, sanityCheckSessionV2} from '../../../brands/Session.brand'
import {refreshOffersActionAtom} from '../../../state/marketplace/atoms/refreshOffersActionAtom'
import {syncVexlNotificationTokensActionAtom} from '../../../state/notifications/actions/syncVexlNotificationTokensActionAtom'
import {sessionHolderAtom} from '../../../state/session'
import {readSessionFromStorage} from '../../../state/session/utils/readSessionFromStorage'
import {getNotificationTokenE} from '../../notifications'
import {
  clearMigrationControlRecord,
  readMigrationControlRecord,
  transitionMigrationControl,
} from '../controlStore'
import {type DestinationAwaitingSourceOutcomeControlRecord} from '../controlStore/domain'
import {
  deleteMigrationSecretsVerified,
  loadMigrationSecret,
  saveMigrationSecret,
} from '../controlStore/secrets'
import {resolveMigrationEndpointHost} from '../emulatorEndpointOverride'
import {
  createNativeTransportChannel,
  type TransportChannel,
} from '../protocol/channel'
import {
  awaitSourceOutcome as awaitSourceOutcomeMessage,
  receiveSnapshot,
  sendDestinationActivated,
  sendDestinationReceiptStored,
  sendDestinationStaged,
  type SourceOutcome,
} from '../protocol/destinationFlow'
import {
  createEncryptedProtocolChannel,
  type EncryptedProtocolChannel,
} from '../protocol/encryptedChannel'
import {runDestinationHandshake} from '../protocol/handshake'
import {
  createEraseCommandQr,
  currentMigrationVersion,
  parseAndValidatePairingQr,
  validateSourceCancellationConfirmed,
  validateSourceErasedReceiptOnDestination,
  type CreatedEraseCommand,
} from '../protocol/qrGlue'
import {verifyFreshInstallForMigration} from '../snapshot/freshInstallCheck'
import {installStagedSnapshot} from '../snapshot/installer'
import {deleteStagingVerified, initStaging} from '../snapshot/stagingStore'

const error = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

export interface ActiveDestinationSession {
  readonly channel: EncryptedProtocolChannel
}

export function startDestinationSession(args: {
  readonly qrString: string
  readonly confirmCode: Effect.Effect<boolean, never>
  readonly onHumanAuthCode?: (code: string) => void
  readonly onBothCodesConfirmed?: () => void
  /** Dev-only TCP routing aid for emulator port forwarding. Never persisted. */
  readonly sourceEndpointHostOverride?: string
}): Effect.Effect<ActiveDestinationSession, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    yield* _(verifyFreshInstallForMigration())
    yield* _(
      Effect.tryPromise({
        try: assertMigrationCryptoSupported,
        catch: () => error('handshakeFailed'),
      })
    )
    const pairing = yield* _(
      parseAndValidatePairingQr({qrString: args.qrString})
    )
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['normal'], {
            mode: 'destinationReceiving',
            enteredAt: unixMillisecondsNow(),
            transferId: pairing.transferId,
            sourceVersion: pairing.version,
            sourceEndpointCandidates: pairing.endpointCandidates,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )

    let transport: TransportChannel | undefined
    for (const endpoint of pairing.endpointCandidates) {
      const connected = yield* _(
        Effect.tryPromise({
          try: async () =>
            await VexlLocalTransport.connect(
              resolveMigrationEndpointHost(
                endpoint.host,
                args.sourceEndpointHostOverride
              ),
              endpoint.port,
              15_000
            ),
          catch: () => error('transportFailed'),
        }).pipe(Effect.option)
      )
      if (Option.isSome(connected)) {
        transport = createNativeTransportChannel({
          connectionId: connected.value.connectionId,
        })
        break
      }
    }
    if (transport === undefined)
      return yield* _(Effect.fail(error('transportFailed')))
    const handshake = yield* _(
      runDestinationHandshake({
        channel: transport,
        version: pairing.version,
        transferId: pairing.transferId,
        pairingCapability: pairing.pairingCapability,
        sourcePublicKey: Base64.toUint8Array(
          pairing.sourceKeyExchangePublicKey
        ),
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
          if (current.mode !== 'destinationReceiving')
            throw error('stateInvalid')
          transitionMigrationControl(['destinationReceiving'], {
            ...current,
            pairingTranscriptDigest: Schema.decodeUnknownSync(
              Schema.String.pipe(
                Schema.pattern(/^[0-9a-f]{64}$/),
                Schema.brand('Sha256Hex')
              )
            )(bytesToHex(handshake.transcriptHash)),
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
    const staging = yield* _(initStaging())
    const received = yield* _(
      receiveSnapshot({
        channel,
        staging,
        transferId: pairing.transferId,
      })
    )
    yield* _(sendDestinationStaged(channel, received.destinationStaged))
    yield* _(
      Effect.try({
        try: () => {
          const current = readMigrationControlRecord()
          if (
            current.mode !== 'destinationReceiving' ||
            current.pairingTranscriptDigest === undefined
          )
            throw error('stateInvalid')
          transitionMigrationControl(['destinationReceiving'], {
            mode: 'destinationStaged',
            enteredAt: current.enteredAt,
            transferId: current.transferId,
            pairingTranscriptDigest: current.pairingTranscriptDigest,
            manifestDigest: received.destinationStaged.manifestDigest,
            snapshotContentDigest:
              received.destinationStaged.snapshotContentDigest,
            stagingReceiptDigest:
              received.destinationStaged.stagingReceiptDigest,
            sourceEndpointCandidates: current.sourceEndpointCandidates,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    return {channel}
  })
}

/** Persists destinationEraseCommandAvailable before returning display data. */
export function prepareEraseCommand(): Effect.Effect<
  CreatedEraseCommand,
  DeviceMigrationError
> {
  return Effect.gen(function* (_) {
    const record = readMigrationControlRecord()
    if (
      record.mode !== 'destinationStaged' &&
      record.mode !== 'destinationEraseCommandAvailable'
    )
      return yield* _(Effect.fail(error('stateInvalid')))
    const txKey = yield* _(loadMigrationSecret('qrAuthTxKey'))
    if (Option.isNone(txKey))
      return yield* _(Effect.fail(error('stateInvalid')))
    const command = yield* _(
      createEraseCommandQr({
        version: currentMigrationVersion,
        transferId: record.transferId,
        manifestDigest: record.manifestDigest,
        snapshotContentDigest: record.snapshotContentDigest,
        stagingReceiptDigest: record.stagingReceiptDigest,
        qrMacTxKey: Base64.toUint8Array(txKey.value),
      })
    )
    const issued = {
      eraseCommandDigest: command.eraseCommandDigest,
      commandNonce: command.qrCode.commandNonce,
      issuedAt: command.qrCode.issuedAt,
      expiresAt: command.qrCode.expiresAt,
    }
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl([record.mode], {
            ...record,
            mode: 'destinationEraseCommandAvailable',
            issuedEraseCommands:
              record.mode === 'destinationEraseCommandAvailable'
                ? [issued, ...record.issuedEraseCommands]
                : [issued],
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    return command
  })
}

export function awaitSourceOutcome(args: {
  readonly channel?: EncryptedProtocolChannel
  readonly scannedQrString?: string
}): Effect.Effect<'erased' | 'cancelled', DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const initialRecord = readMigrationControlRecord()
    if (
      initialRecord.mode !== 'destinationEraseCommandAvailable' &&
      initialRecord.mode !== 'destinationAwaitingSourceOutcome'
    )
      return yield* _(Effect.fail(error('stateInvalid')))
    let record: DestinationAwaitingSourceOutcomeControlRecord
    if (initialRecord.mode === 'destinationEraseCommandAvailable') {
      const next: DestinationAwaitingSourceOutcomeControlRecord = {
        ...initialRecord,
        mode: 'destinationAwaitingSourceOutcome',
      }
      yield* _(
        Effect.try({
          try: () => {
            transitionMigrationControl(
              ['destinationEraseCommandAvailable'],
              next
            )
          },
          catch: () => error('stateInvalid'),
        })
      )
      record = next
    } else record = initialRecord
    const rxKey = yield* _(loadMigrationSecret('qrAuthRxKey'))
    if (Option.isNone(rxKey))
      return yield* _(Effect.fail(error('stateInvalid')))

    let qrString = args.scannedQrString
    if (qrString === undefined) {
      if (args.channel === undefined)
        return yield* _(Effect.fail(error('stateInvalid')))
      const outcome = yield* _(awaitSourceOutcomeMessage(args.channel))
      // Domain LAN records and QR records have identical fields but distinct
      // tags. Re-encode manually through the QR classes below.
      qrString = yield* _(lanOutcomeToQrString(outcome))
    }
    const cancellation = yield* _(
      validateSourceCancellationConfirmed({
        qrString,
        expected: {
          version: currentMigrationVersion,
          transferId: record.transferId,
          manifestDigest: record.manifestDigest,
          snapshotContentDigest: record.snapshotContentDigest,
        },
        qrMacRxKey: Base64.toUint8Array(rxKey.value),
        usedNonces: new Set(),
      }).pipe(Effect.option)
    )
    if (Option.isSome(cancellation)) {
      yield* _(deleteStagingVerified())
      yield* _(deleteMigrationSecretsVerified())
      yield* _(
        Effect.try({
          try: () => {
            transitionMigrationControl(['destinationAwaitingSourceOutcome'], {
              mode: 'normal',
            })
          },
          catch: () => error('stateInvalid'),
        })
      )
      return 'cancelled'
    }
    // The receipt identifies which of the regenerated commands was accepted.
    // Try each issued command without mutating replay state until one binds.
    let validated: SourceErasedReceiptQrCode | undefined
    for (const issued of record.issuedEraseCommands) {
      const attempt = yield* _(
        validateSourceErasedReceiptOnDestination({
          qrString,
          expected: {
            version: currentMigrationVersion,
            transferId: record.transferId,
            manifestDigest: record.manifestDigest,
            snapshotContentDigest: record.snapshotContentDigest,
            acceptedEraseCommandDigest: issued.eraseCommandDigest,
            acceptedEraseCommandNonce: issued.commandNonce,
          },
          qrMacRxKey: Base64.toUint8Array(rxKey.value),
          usedNonces: new Set(),
        }).pipe(Effect.option)
      )
      if (Option.isSome(attempt)) {
        validated = attempt.value
        break
      }
    }
    if (validated === undefined)
      return yield* _(Effect.fail(error('receiptInvalid')))
    // Receipt is durably persisted before any install call can occur.
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['destinationAwaitingSourceOutcome'], {
            ...record,
            mode: 'destinationSourceEraseConfirmed',
            sourceErasedReceipt: validated,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    if (args.channel !== undefined)
      yield* _(
        sendDestinationReceiptStored(
          args.channel,
          new DestinationReceiptStored({
            sender: 'destination',
            transferId: record.transferId,
            receiptNonce: validated.receiptNonce,
          })
        )
      )
    return 'erased'
  })
}

function lanOutcomeToQrString(
  outcome: SourceOutcome
): Effect.Effect<string, DeviceMigrationError> {
  const qr =
    outcome._tag === 'SourceErased'
      ? new SourceErasedReceiptQrCode({
          qrSchemaVersion: outcome.qrSchemaVersion,
          version: outcome.version,
          transferId: outcome.transferId,
          manifestDigest: outcome.manifestDigest,
          snapshotContentDigest: outcome.snapshotContentDigest,
          acceptedEraseCommandDigest: outcome.acceptedEraseCommandDigest,
          acceptedEraseCommandNonce: outcome.acceptedEraseCommandNonce,
          receiptNonce: outcome.receiptNonce,
          cleanupResultDigest: outcome.cleanupResultDigest,
          issuedAt: outcome.issuedAt,
          mac: outcome.mac,
        })
      : new SourceCancellationConfirmedQrCode({
          qrSchemaVersion: outcome.qrSchemaVersion,
          version: outcome.version,
          transferId: outcome.transferId,
          manifestDigest: outcome.manifestDigest,
          snapshotContentDigest: outcome.snapshotContentDigest,
          cancellationNonce: outcome.cancellationNonce,
          issuedAt: outcome.issuedAt,
          mac: outcome.mac,
        })
  const encoded = qr.encodeToQrString()
  return encoded._tag === 'Right'
    ? Effect.succeed(encoded.right)
    : Effect.fail(encoded.left)
}

function defaultActivation(): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const session = yield* _(
      readSessionFromStorage().pipe(
        Effect.mapError(() => error('sessionInvalid'))
      )
    )
    if (!isSessionV2(session) || !sanityCheckSessionV2(session))
      return yield* _(Effect.fail(error('sessionInvalid')))
    const store = getDefaultStore()
    store.set(sessionHolderAtom, {state: 'loggedIn', session})
    const expoToken = yield* _(getNotificationTokenE())
    yield* _(
      store
        .set(syncVexlNotificationTokensActionAtom, {
          expoNotificationToken: expoToken,
        })
        .pipe(Effect.mapError(() => error('stateInvalid')))
    )
    yield* _(
      store
        .set(refreshOffersActionAtom, {
          forceRemovedOffersReconciliation: true,
        })
        .pipe(Effect.mapError(() => error('stateInvalid')))
    )
  }).pipe(
    withAllowedVexlOperations([
      'notificationTokenUpdate',
      'accountReconciliation',
    ])
  )
}

export function runDestinationInstall(args?: {
  readonly channel?: EncryptedProtocolChannel
  readonly activation?: Effect.Effect<void, DeviceMigrationError>
  readonly reload?: () => Promise<void>
}): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    const beforeInstall = readMigrationControlRecord()
    if (beforeInstall.mode !== 'destinationActivating') {
      yield* _(installStagedSnapshot())
      // Persisted MMKV atoms were constructed from the fresh-install state in
      // this JavaScript runtime. Reload at the durable activation checkpoint
      // so reconciliation reads the newly installed atoms from storage.
      if (args?.activation === undefined) {
        yield* _(
          Effect.tryPromise({
            try: async () => {
              await (args?.reload ?? reloadAppAsync)()
            },
            catch: () => error('stateInvalid'),
          })
        )
        return
      }
    }
    const activating = readMigrationControlRecord()
    if (activating.mode !== 'destinationActivating')
      return yield* _(Effect.fail(error('stateInvalid')))
    yield* _(args?.activation ?? defaultActivation())
    if (args?.channel !== undefined)
      yield* _(
        sendDestinationActivated(
          args.channel,
          new DestinationActivated({
            sender: 'destination',
            transferId: activating.transferId,
          })
        )
      )
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['destinationActivating'], {
            mode: 'destinationComplete',
            enteredAt: unixMillisecondsNow(),
            transferId: activating.transferId,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    yield* _(deleteStagingVerified())
    yield* _(deleteMigrationSecretsVerified())
    yield* _(
      Effect.try({
        try: clearMigrationControlRecord,
        catch: () => error('stateInvalid'),
      })
    )
    yield* _(
      Effect.tryPromise({
        try: async () => {
          await (args?.reload ?? reloadAppAsync)()
        },
        catch: () => error('stateInvalid'),
      })
    )
  })
}

export function finalizeDestinationCompletion(args?: {
  readonly reload?: () => Promise<void>
}): Effect.Effect<void, DeviceMigrationError> {
  const record = readMigrationControlRecord()
  if (record.mode !== 'destinationComplete')
    return Effect.fail(error('stateInvalid'))
  return deleteStagingVerified().pipe(
    Effect.flatMap(() => deleteMigrationSecretsVerified()),
    Effect.flatMap(() =>
      Effect.try({
        try: clearMigrationControlRecord,
        catch: () => error('stateInvalid'),
      })
    ),
    Effect.flatMap(() =>
      Effect.tryPromise({
        try: async () => {
          await (args?.reload ?? reloadAppAsync)()
        },
        catch: () => error('stateInvalid'),
      })
    )
  )
}

export function safeCancelDestination(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  const record = readMigrationControlRecord()
  if (
    record.mode !== 'destinationReceiving' &&
    record.mode !== 'destinationStaged'
  )
    return Effect.fail(error('stateInvalid'))
  return deleteStagingVerified().pipe(
    Effect.flatMap(() => deleteMigrationSecretsVerified()),
    Effect.flatMap(() =>
      Effect.try({
        try: () => {
          transitionMigrationControl([record.mode], {mode: 'normal'})
        },
        catch: () => error('stateInvalid'),
      })
    )
  )
}
