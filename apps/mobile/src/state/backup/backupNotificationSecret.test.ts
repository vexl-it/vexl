import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Schema} from 'effect'
import {notificationSecretForBackup} from './backupNotificationSecret'

jest.mock('react-native-mmkv')

const token = Schema.decodeSync(VexlNotificationToken)
const inboxKey = generatePrivateKey()
const notificationState = {
  secret: Schema.decodeSync(VexlNotificationTokenSecret)('vexl_nt_secret_a'),
  systemVexlToken: token('vexl_nt_system'),
  marketingVexlToken: null,
  lastUpdatedMetadata: null,
}

describe('notificationSecretForBackup', () => {
  it('exports the secret, its tokens and which inbox each token notifies', () => {
    expect(
      notificationSecretForBackup({
        notificationState,
        tokenToKeyHolder: {[token('vexl_nt_inbox')]: inboxKey},
        sessionNotificationToken: token('vexl_nt_session'),
      })
    ).toEqual({
      secret: notificationState.secret,
      systemVexlToken: notificationState.systemVexlToken,
      marketingVexlToken: undefined,
      sessionNotificationToken: token('vexl_nt_session'),
      inboxesByToken: {vexl_nt_inbox: inboxKey.publicKeyPemBase64},
    })
  })

  it('exports nothing without a secret', () => {
    expect(
      notificationSecretForBackup({
        notificationState: {...notificationState, secret: null},
        tokenToKeyHolder: {},
        sessionNotificationToken: undefined,
      })
    ).toBeUndefined()
  })
})
