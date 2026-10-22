import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {
  type ClubKeys,
  generateClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {
  KeyDerivationIndex,
  MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {BackupFileFromJson} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {Effect, Schema} from 'effect'
import {type SessionV2} from '../../brands/Session.brand'
import {dummySession} from '../session/dummySesssion'
import {createBackupFile} from './createBackupFile'

jest.mock('react-native-mmkv')

const masterSeed = Schema.decodeSync(MasterSeed)('11'.repeat(32))
const index = KeyDerivationIndex.make
const session: SessionV2 = {...dummySession, masterSeed}

const randomClubKeys = async (): Promise<ClubKeys> => ({
  keyPair: await generateKeyPair(),
  oldKeyPair: generatePrivateKey(),
})

describe('createBackupFile', () => {
  it('exports the session, seed and only the legacy keys', async () => {
    const [derivedInbox0, derivedInbox1, inboxAboveCounter] =
      await Effect.runPromise(
        Effect.all([
          deriveInboxPrivateKey(masterSeed, index(0)),
          deriveInboxPrivateKey(masterSeed, index(1)),
          deriveInboxPrivateKey(masterSeed, index(2)),
        ])
      )
    const [derivedClub0, derivedClub1] = await Effect.runPromise(
      Effect.all([
        deriveClubKeys(masterSeed, index(0)),
        deriveClubKeys(masterSeed, index(1)),
      ])
    )
    const legacyInbox = generatePrivateKey()
    const legacyClub = await randomClubKeys()
    const legacyWaitingClub = await randomClubKeys()
    const derivedClubUuid = generateClubUuid()
    const legacyClubUuid = generateClubUuid()

    const backupFile = await Effect.runPromise(
      createBackupFile({
        session,
        counters: {nextInboxIndex: index(2), nextClubIndex: index(2)},
        inboxKeys: [
          derivedInbox0,
          legacyInbox,
          session.privateKey,
          derivedInbox1,
          legacyInbox,
          inboxAboveCounter,
        ],
        clubs: {
          [derivedClubUuid]: derivedClub0,
          [legacyClubUuid]: legacyClub,
        },
        clubKeysWaitingForAdmission: [derivedClub1, legacyWaitingClub],
      })
    )

    expect(backupFile).toEqual({
      session: {
        phoneNumber: session.phoneNumber,
        sessionCredentials: session.sessionCredentials,
        privateKey: session.privateKey,
        keyPairV2: session.keyPairV2,
        isLiquidityProvider: session.isLiquidityProvider,
      },
      masterSeed,
      // A derived key above the counter can't be told apart from a random
      // one, so it's over-included rather than lost.
      legacyInboxKeys: [legacyInbox, inboxAboveCounter],
      legacyClubKeys: {[legacyClubUuid]: legacyClub},
      legacyClubKeysWaitingForAdmission: [legacyWaitingClub],
    })

    const json = Schema.encodeSync(BackupFileFromJson)(backupFile)
    expect(Schema.decodeSync(BackupFileFromJson)(json)).toEqual(backupFile)
    expect(json).not.toContain(dummySession.loginSessionId)
  })
})
