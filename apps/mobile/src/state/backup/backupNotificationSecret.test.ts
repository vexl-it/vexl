import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Schema} from 'effect'
import {
  notificationSecretForBackup,
  restoredNotificationSecretState,
} from './backupNotificationSecret'

jest.mock('react-native-mmkv')

const secret = Schema.decodeSync(VexlNotificationTokenSecret)(
  'vexl_nt_secret_a'
)

describe('notificationSecretForBackup', () => {
  it('exports only the secret, no tokens that go stale', () => {
    expect(
      notificationSecretForBackup({
        secret,
        systemVexlToken: Schema.decodeSync(VexlNotificationToken)(
          'vexl_nt_system'
        ),
        marketingVexlToken: null,
        lastUpdatedMetadata: null,
      })
    ).toEqual({secret})
  })

  it('exports nothing without a secret', () => {
    expect(
      notificationSecretForBackup({
        secret: null,
        systemVexlToken: null,
        marketingVexlToken: null,
        lastUpdatedMetadata: null,
      })
    ).toBeUndefined()
  })
})

describe('restoredNotificationSecretState', () => {
  it('keeps the secret and leaves the tokens to be minted anew', () => {
    expect(restoredNotificationSecretState(secret)).toEqual({
      secret,
      systemVexlToken: null,
      marketingVexlToken: null,
      lastUpdatedMetadata: null,
    })
  })
})
