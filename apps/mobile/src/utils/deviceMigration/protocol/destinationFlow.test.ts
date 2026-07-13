import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {
  EraseCommandAccepted,
  SourceCancellationConfirmed,
  type DeviceMigrationProtocolMessage,
} from '@vexl-next/domain/src/general/deviceMigration/protocolMessages'
import {
  testCommandNonce,
  testEraseCommandDigest,
  testManifestDigest,
  testQrAuthMac,
  testReceiptNonce,
  testSnapshotContentDigest,
  testTransferId,
  testVersionTriple,
} from '@vexl-next/domain/src/general/deviceMigration/testFixtures'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {awaitSourceOutcome} from './destinationFlow'
import {type EncryptedProtocolChannel} from './encryptedChannel'

jest.mock('../snapshot/ensurePersistenceModulesRegistered', () => ({}))
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 2,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

const error = new DeviceMigrationError({code: 'transportFailed'})

describe('destination device migration flow', () => {
  it('accepts the retirement commitment before the terminal source outcome', async () => {
    const messages: readonly DeviceMigrationProtocolMessage[] = [
      new EraseCommandAccepted({
        sender: 'source',
        transferId: testTransferId,
        eraseCommandDigest: testEraseCommandDigest,
        commandNonce: testCommandNonce,
      }),
      new SourceCancellationConfirmed({
        sender: 'source',
        qrSchemaVersion: 1,
        version: testVersionTriple,
        transferId: testTransferId,
        manifestDigest: testManifestDigest,
        snapshotContentDigest: testSnapshotContentDigest,
        cancellationNonce: testReceiptNonce,
        issuedAt: Schema.decodeSync(UnixMilliseconds)(1751000000000),
        mac: testQrAuthMac,
      }),
    ]
    let index = 0
    const channel: EncryptedProtocolChannel = {
      sendMessage: () => Effect.void,
      nextMessage: () => {
        const message = messages[index]
        index += 1
        return message === undefined
          ? Effect.fail(error)
          : Effect.succeed(message)
      },
      peerFinished: () => false,
      close: () => Effect.void,
    }

    await expect(Effect.runPromise(awaitSourceOutcome(channel))).resolves.toBe(
      messages[1]
    )
  })
})
