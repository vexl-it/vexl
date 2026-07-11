import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Either, Schema} from 'effect'
import {VexlNotificationSecretState} from '../../../state/notifications/vexlNotificationTokenAtom'
import {TradeRemindersState} from '../../../state/tradeReminders/domain'
import {Preferences} from '../../preferences/domain'
import {applyPerKeyExportTransform} from './exporter'

jest.mock('./ensurePersistenceModulesRegistered', () => ({}))
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

function decodeTransformed<A, I>(
  schema: Schema.Schema<A, I, never>,
  result: Either.Either<string, unknown>
): A {
  if (Either.isLeft(result)) throw new Error('transform failed')
  return Schema.decodeSync(Schema.parseJson(schema))(result.right)
}

describe('snapshot per-key transforms', () => {
  it('strips only source notification metadata', () => {
    const input = Schema.encodeSync(
      Schema.parseJson(VexlNotificationSecretState)
    )({
      secret: null,
      systemVexlToken: null,
      marketingVexlToken: null,
      lastUpdatedMetadata: {
        version: Schema.decodeSync(VersionCode)(42),
        locale: 'en',
      },
    })
    const output = decodeTransformed(
      VexlNotificationSecretState,
      applyPerKeyExportTransform('vexlNotificationToken', input)
    )
    expect(output).toEqual({
      secret: null,
      systemVexlToken: null,
      marketingVexlToken: null,
      lastUpdatedMetadata: null,
    })
  })

  it('resets developer/task fields and preserves user preferences', () => {
    const inputValue = Schema.decodeSync(Preferences)({
      notificationPreferences: {
        offer: true,
        chat: false,
        marketplace: true,
        newOfferInMarketplace: false,
        newPhoneContacts: true,
        inactivityWarnings: false,
        marketing: true,
      },
      allowSendingImages: true,
      isDeveloper: true,
      showTextDebugButton: true,
      enableNewOffersNotificationDevMode: true,
      runTasksInParallel: false,
      lastUsedOfferSpokenLanguages: [],
    })
    const input = Schema.encodeSync(Schema.parseJson(Preferences))(inputValue)
    const output = decodeTransformed(
      Preferences,
      applyPerKeyExportTransform('preferences', input)
    )
    expect(output.allowSendingImages).toBe(true)
    expect(output.notificationPreferences).toEqual(
      inputValue.notificationPreferences
    )
    expect(output.isDeveloper).toBe(false)
    expect(output.showTextDebugButton).toBe(false)
    expect(output.enableNewOffersNotificationDevMode).toBe(false)
    expect(output.runTasksInParallel).toBe(true)
  })

  it('drops OS notification identifiers but keeps reminder timing', () => {
    const inputValue = Schema.decodeSync(TradeRemindersState)({
      reminders: [
        {
          chatId: 'chat',
          notificationId: 'source-os-id',
          scheduledFor: 100,
          meetingTime: 200,
        },
      ],
    })
    const input = Schema.encodeSync(Schema.parseJson(TradeRemindersState))(
      inputValue
    )
    const output = decodeTransformed(
      TradeRemindersState,
      applyPerKeyExportTransform('tradeReminders', input)
    )
    expect(output.reminders).toEqual([
      {
        chatId: 'chat',
        notificationId: '',
        scheduledFor: 100,
        meetingTime: 200,
      },
    ])
  })
})
