import {generateEphemeralKxKeyPair} from '@vexl-next/cryptography/src/operations/deviceMigration/keyExchange'
import {
  PairingCapability,
  TransferId,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {DestinationActivated} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {
  CURRENT_MIGRATION_PROTOCOL_VERSION,
  CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
} from '@vexl-next/domain/src/general/deviceMigration/version'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {Deferred, Effect, Schema} from 'effect'
import {createInMemoryChannelPair} from './channel'
import {createEncryptedProtocolChannel} from './encryptedChannel'
import {
  createSingleUsePairingCapability,
  runDestinationHandshake,
  runSourceHandshake,
} from './handshake'

const version = {
  appVersion: Schema.decodeSync(SemverString)('1.44.2'),
  migrationProtocolVersion: CURRENT_MIGRATION_PROTOCOL_VERSION,
  snapshotStorageSchemaVersion: CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
}
const transferId = Schema.decodeSync(TransferId)('A'.repeat(43))
const capability = Schema.decodeSync(PairingCapability)('B'.repeat(43))

describe('device migration handshake and encrypted channel', () => {
  it('derives mirrored keys, identical human codes and exchanges typed messages', async () => {
    const pair = createInMemoryChannelPair()
    const sourceKeys = await generateEphemeralKxKeyPair()
    const [source, destination] = await Promise.all([
      Effect.runPromise(
        runSourceHandshake({
          channel: pair.first,
          version,
          transferId,
          pairingCapability: capability,
          ownKeyPair: sourceKeys,
          singleUse: createSingleUsePairingCapability(),
          confirmCode: Effect.succeed(true),
        })
      ),
      Effect.runPromise(
        runDestinationHandshake({
          channel: pair.second,
          version,
          transferId,
          pairingCapability: capability,
          sourcePublicKey: sourceKeys.publicKey,
          confirmCode: Effect.succeed(true),
        })
      ),
    ])
    expect(source.humanAuthCode).toBe(destination.humanAuthCode)
    expect(source.transcriptHash).toEqual(destination.transcriptHash)
    expect(source.keys.streamTxKey).toEqual(destination.keys.streamRxKey)

    const [sourceChannel, destinationChannel] = await Promise.all([
      Effect.runPromise(
        createEncryptedProtocolChannel({
          transport: pair.first,
          streamTxKey: source.keys.streamTxKey,
          streamRxKey: source.keys.streamRxKey,
        })
      ),
      Effect.runPromise(
        createEncryptedProtocolChannel({
          transport: pair.second,
          streamTxKey: destination.keys.streamTxKey,
          streamRxKey: destination.keys.streamRxKey,
        })
      ),
    ])
    await Effect.runPromise(
      destinationChannel.sendMessage(
        new DestinationActivated({sender: 'destination', transferId}),
        true
      )
    )
    const message = await Effect.runPromise(sourceChannel.nextMessage())
    expect(message._tag).toBe('DestinationActivated')
    expect(sourceChannel.peerFinished()).toBe(true)
  })

  it.each(['source', 'destination'])(
    'completes when the %s device approves first',
    async (firstApproval) => {
      const pair = createInMemoryChannelPair()
      const sourceKeys = await generateEphemeralKxKeyPair()
      const sourceApproval = Effect.runSync(Deferred.make<boolean>())
      const destinationApproval = Effect.runSync(Deferred.make<boolean>())
      const sourceCodeReady = Effect.runSync(Deferred.make<void>())
      const destinationCodeReady = Effect.runSync(Deferred.make<void>())
      const sourceBothApproved = Effect.runSync(Deferred.make<void>())
      const destinationBothApproved = Effect.runSync(Deferred.make<void>())

      const source = Effect.runPromise(
        runSourceHandshake({
          channel: pair.first,
          version,
          transferId,
          pairingCapability: capability,
          ownKeyPair: sourceKeys,
          singleUse: createSingleUsePairingCapability(),
          confirmCode: Deferred.await(sourceApproval),
          onHumanAuthCode: () => {
            Effect.runSync(Deferred.succeed(sourceCodeReady, undefined))
          },
          onBothCodesConfirmed: () => {
            Effect.runSync(Deferred.succeed(sourceBothApproved, undefined))
          },
        })
      )
      const destination = Effect.runPromise(
        runDestinationHandshake({
          channel: pair.second,
          version,
          transferId,
          pairingCapability: capability,
          sourcePublicKey: sourceKeys.publicKey,
          confirmCode: Deferred.await(destinationApproval),
          onHumanAuthCode: () => {
            Effect.runSync(Deferred.succeed(destinationCodeReady, undefined))
          },
          onBothCodesConfirmed: () => {
            Effect.runSync(Deferred.succeed(destinationBothApproved, undefined))
          },
        })
      )

      await Promise.all([
        Effect.runPromise(Deferred.await(sourceCodeReady)),
        Effect.runPromise(Deferred.await(destinationCodeReady)),
      ])
      if (firstApproval === 'source') {
        Effect.runSync(Deferred.succeed(sourceApproval, true))
        expect(Effect.runSync(Deferred.isDone(sourceBothApproved))).toBe(false)
        Effect.runSync(Deferred.succeed(destinationApproval, true))
      } else {
        Effect.runSync(Deferred.succeed(destinationApproval, true))
        expect(Effect.runSync(Deferred.isDone(destinationBothApproved))).toBe(
          false
        )
        Effect.runSync(Deferred.succeed(sourceApproval, true))
      }

      const [sourceResult, destinationResult] = await Promise.all([
        source,
        destination,
        Effect.runPromise(Deferred.await(sourceBothApproved)),
        Effect.runPromise(Deferred.await(destinationBothApproved)),
      ])
      expect(sourceResult.humanAuthCode).toBe(destinationResult.humanAuthCode)
    }
  )

  it('rejects a wrong pairing capability', async () => {
    const pair = createInMemoryChannelPair()
    const sourceKeys = await generateEphemeralKxKeyPair()
    const wrong = Schema.decodeSync(PairingCapability)('C'.repeat(43))
    const destination = Effect.runPromise(
      runDestinationHandshake({
        channel: pair.second,
        version,
        transferId,
        pairingCapability: wrong,
        sourcePublicKey: sourceKeys.publicKey,
        confirmCode: Effect.succeed(true),
      })
    )
    await expect(
      Effect.runPromise(
        runSourceHandshake({
          channel: pair.first,
          version,
          transferId,
          pairingCapability: capability,
          ownKeyPair: sourceKeys,
          singleUse: createSingleUsePairingCapability(),
          confirmCode: Effect.succeed(true),
        })
      )
    ).rejects.toBeDefined()
    await Effect.runPromise(pair.first.close().pipe(Effect.ignore))
    await expect(destination).rejects.toBeDefined()
  })
})
