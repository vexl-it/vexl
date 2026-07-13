/**
 * Registry tripwire test (spec section "Migration policy registry"): imports
 * every module that declares a persisted MMKV key and asserts that the
 * registered inventory exactly matches the expected key -> policy table.
 *
 * If this test fails because you ADDED a persisted key: add the key with an
 * explicit, reviewed migration policy to EXPECTED_STATIC_KEYS below. There is
 * deliberately no permissive default — an unregistered key fails snapshot
 * creation at migration time, and an unlisted key fails this test.
 */
import {
  getRegisteredDynamicKeyFamilyPrefixes,
  getRegisteredStaticKeys,
  resolveMmkvKeyPolicy,
  type ResolvedMmkvKeyPolicy,
} from './mmkvMigrationRegistry'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 2,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}))

jest.mock('expo-notifications', () => ({
  __esModule: true,
  AndroidImportance: {DEFAULT: 5, HIGH: 6},
  AndroidNotificationPriority: {DEFAULT: 'default', HIGH: 'high'},
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  getPresentedNotificationsAsync: jest.fn(async () => []),
  dismissNotificationAsync: jest.fn(async () => undefined),
}))

jest.mock('../reportError', () => ({
  __esModule: true,
  default: jest.fn(),
  reportErrorE: jest.fn(),
}))

// expo-contacts' native module base class is unavailable in the jest env.
jest.mock('expo-contacts', () => ({
  __esModule: true,
  getPermissionsAsync: jest.fn(async () => ({status: 'denied'})),
  requestPermissionsAsync: jest.fn(async () => ({status: 'denied'})),
  // enum lookups at module scope — any accessed member resolves to its name
  ContactField: new Proxy({}, {get: (_target, prop) => String(prop)}),
  Contact: {getAllDetails: jest.fn(async () => [])},
}))

// Reanimated (and the worklets runtime it initializes) needs its official
// jest mocks — the real modules install native unpackers at import time.
jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/src/mock')
)
jest.mock('react-native-reanimated', () =>
  jest.requireActual('react-native-reanimated/mock')
)

// react-native-keyboard-controller registers a NativeEventEmitter at import
// time, which requires the (absent) native module.
jest.mock('react-native-keyboard-controller', () => ({
  __esModule: true,
  KeyboardAwareScrollView: () => null,
  KeyboardStickyView: () => null,
  KeyboardController: {},
}))

// Clipboard's TurboModule is not registered in the jest binary.
jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {getString: jest.fn(async () => ''), setString: jest.fn()},
}))

// bunshi's dist/react entry point does not resolve in the jest environment.
jest.mock(
  'bunshi/dist/react',
  () => ({
    __esModule: true,
    createScope: jest.fn((defaultValue: unknown) => ({defaultValue})),
    molecule: jest.fn(() => ({})),
    useMolecule: jest.fn(),
  }),
  {virtual: true}
)

// url-join ships untranspiled ESM which jest-expo does not transform.
jest.mock('url-join', () => ({
  __esModule: true,
  default: (...parts: string[]): string => parts.join('/'),
}))

// The global jest.setup mock only provides useTranslation; some persistence
// modules call getCurrentLocale / read translationAtom at import time.
jest.mock('../localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  const t = (key: string): string => key
  return {
    __esModule: true,
    useTranslation: () => ({t}),
    getCurrentLocale: () => 'en',
    translationAtom: atom({t}),
  }
})

// Every module that declares a persisted MMKV key or dynamic key family.
// Imported for their registration side effects.
/* eslint-disable import/first */
import '../../components/AppLogsScreen/utils/storage'
import '../../components/ChatDetailScreen/atoms/createHideActionForMessageMmkvAtom'
import '../../components/FullscreenWarningScreen/state'
import '../../components/NotificationsScreen/state/notificationScreenDataAtoms'
import '../../components/NotificationsScreen/state/vexlProductNotifications'
import '../../components/VersionMigrations/atoms'
import '../../components/VersionMigrations/migrations/contacts'
import '../../state/ActionBenchmarks'
import '../../state/accountStatsAtom'
import '../../state/chat/atoms/messagingStateAtom'
import '../../state/chat/atoms/reportMessagesReceivedActionAtom'
import '../../state/chat/atoms/showVexlbotInitialMessageForAllChatsAtom'
import '../../state/clubs/atom/clubsToKeyHolderAtom'
import '../../state/clubs/atom/clubsToKeyHolderV2Atom'
import '../../state/clubs/atom/clubsWithMembersAtom'
import '../../state/clubs/atom/removedClubsAtom'
import '../../state/connections/atom/connectionStateAtom'
import '../../state/connections/atom/noteToConnectionsAtom'
import '../../state/connections/atom/offerToConnectionsAtom'
import '../../state/connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import '../../state/connections/atom/repostToConnectionsAtom'
import '../../state/contacts/atom/contactsStore'
import '../../state/currentBtcPriceAtoms'
import '../../state/donations/atom'
import '../../state/lastRouteMmkvAtom'
import '../../state/marketplace/atoms/filterAtoms'
import '../../state/marketplace/atoms/myOffers'
import '../../state/marketplace/atoms/offerSuggestionVisible'
import '../../state/marketplace/atoms/offersMissingOnServer'
import '../../state/marketplace/atoms/offersState'
import '../../state/notes/atoms/notesState'
import '../../state/notifications/fcmCypherToKeyHolderAtom'
import '../../state/notifications/fcmServerPublicKeyStore'
import '../../state/notifications/vexlNotificationTokenAtom'
import '../../state/notifications/vexlTokenToKeyHolderAtom'
import '../../state/numberOfLoginAttemptsMmkvAtom'
import '../../state/postLoginOnboarding'
import '../../state/session/utils/v2SecretStorageFlag'
import '../../state/tradeChecklist/atoms/vexlCalendarStorageAtom'
import '../../state/tradeReminders/atoms/tradeRemindersAtom'
import '../deepLinks'
import '../lastTimeAppWasRunning'
import '../mmkv/detectMmkvDataLoss'
import '../newOffersNotificationBackgroundTask/store'
import '../notifications'
import '../notifications/cancelNewChatNotifications'
import '../notifications/showDebugNotificationIfEnabled'
import '../prPreview'
import '../preferences'
import './atomWithParsedMmkvStorage'
/* eslint-enable import/first */

const EXPECTED_STATIC_KEYS: Record<string, ResolvedMmkvKeyPolicy> = {
  // account data — exact account state required on the destination
  messagingState: {policy: 'account', nativeType: 'string'},
  offers: {policy: 'account', nativeType: 'string'},
  notes: {policy: 'account', nativeType: 'string'},
  storedContacts: {policy: 'account', nativeType: 'string'},
  connectionsStateV2: {policy: 'account', nativeType: 'string'},
  'note-to-connections': {policy: 'account', nativeType: 'string'},
  'offer-to-connections': {policy: 'account', nativeType: 'string'},
  'repost-to-connections': {policy: 'account', nativeType: 'string'},
  persistedDataAboutReachAndImportedContacts: {
    policy: 'account',
    nativeType: 'string',
  },
  storedClubsV2: {policy: 'account', nativeType: 'string'},
  clubsWithMembers: {policy: 'account', nativeType: 'string'},
  removedClubs: {policy: 'account', nativeType: 'string'},
  fcmCypherToKeyHolder: {policy: 'account', nativeType: 'string'},
  vexlTokenToKeyHolder: {policy: 'account', nativeType: 'string'},
  // exporter strips lastUpdatedMetadata (source expo token) before snapshot
  vexlNotificationToken: {policy: 'account', nativeType: 'string'},
  notificationScreenData: {policy: 'account', nativeType: 'string'},
  vexlProductNotificationsCursor: {policy: 'account', nativeType: 'string'},
  accountStats: {policy: 'account', nativeType: 'string'},
  myDonations: {policy: 'account', nativeType: 'string'},
  reportedMessagesStorage: {policy: 'account', nativeType: 'string'},
  'offers-missing-on-server': {policy: 'account', nativeType: 'string'},
  accountActionSteps: {policy: 'account', nativeType: 'string'},
  postLoginFlowProgress1: {policy: 'account', nativeType: 'string'},
  // exporter resets developer/diagnostic fields before snapshot
  preferences: {policy: 'account', nativeType: 'string'},

  // user-facing preferences that follow the account
  offersFilterV2: {policy: 'preference', nativeType: 'string'},
  createOfferSuggestionVisible: {policy: 'preference', nativeType: 'string'},
  importNewContactsSuggestionDismissed: {
    policy: 'preference',
    nativeType: 'string',
  },
  showVexlbotInitialMessageForAllChats: {
    policy: 'preference',
    nativeType: 'string',
  },
  cancelledIds: {policy: 'preference', nativeType: 'string'},

  // migrated logically, device-local fields rebuilt after activation
  tradeReminders: {policy: 'rebuild', nativeType: 'string'},

  // storage-migration metadata handled by the installer, never exported
  migration: {policy: 'lifecycle', nativeType: 'string'},
  importedContacts: {policy: 'lifecycle', nativeType: 'string'},
  storedClubs: {policy: 'lifecycle', nativeType: 'string'},
  offersFilter: {policy: 'lifecycle', nativeType: 'string'},

  // installation / OS-specific values that never migrate
  'was-last-route-before-redirect-contacts-screen': {
    policy: 'deviceLocal',
    nativeType: 'string',
  },
  vexlCalendar: {policy: 'deviceLocal', nativeType: 'string'},
  lastInitialLink: {policy: 'deviceLocal', nativeType: 'string'},
  lastUniversalOrAppLink: {policy: 'deviceLocal', nativeType: 'string'},
  alreadyReportedNotificationsIds: {
    policy: 'deviceLocal',
    nativeType: 'string',
  },
  previewChannel: {policy: 'deviceLocal', nativeType: 'string'},
  notificationServerKey: {policy: 'deviceLocal', nativeType: 'string'},
  logs: {policy: 'deviceLocal', nativeType: 'string'},
  logs_enabled: {policy: 'deviceLocal', nativeType: 'boolean'},
  'session:v2SecretWasWritten': {policy: 'deviceLocal', nativeType: 'boolean'},
  lastTimeAppWasRunning: {policy: 'deviceLocal', nativeType: 'string'},
  notificationToken: {policy: 'deviceLocal', nativeType: 'string'},
  debugNotificationsEnabled: {policy: 'deviceLocal', nativeType: 'string'},

  // caches, diagnostics, replay cursors and transient state — never migrate
  numberOfLoginAttempts: {policy: 'ephemeral', nativeType: 'string'},
  brcPrice: {policy: 'ephemeral', nativeType: 'string'},
  newOfferNotificationPreferences: {policy: 'ephemeral', nativeType: 'string'},
  actionsBenchmarks: {policy: 'ephemeral', nativeType: 'string'},
  __clear_storage: {policy: 'ephemeral', nativeType: 'string'},
  __mmkv_data_exists: {policy: 'ephemeral', nativeType: 'string'},
}

const EXPECTED_DYNAMIC_KEY_FAMILIES: Record<string, ResolvedMmkvKeyPolicy> = {
  'hideForMessage-': {policy: 'account', nativeType: 'string'},
}

describe('MMKV migration registry inventory', () => {
  it('registers every expected static key with the expected policy and native type', () => {
    for (const [key, expected] of Object.entries(EXPECTED_STATIC_KEYS)) {
      expect({key, resolved: resolveMmkvKeyPolicy(key)}).toEqual({
        key,
        resolved: expected,
      })
    }
  })

  it('does not register any static key that is missing from the expected inventory', () => {
    const unexpected = getRegisteredStaticKeys().filter(
      (key) => !(key in EXPECTED_STATIC_KEYS)
    )
    // A key listed here was registered without being added to this test's
    // reviewed inventory. Decide its migration policy explicitly and add it
    // to EXPECTED_STATIC_KEYS.
    expect(unexpected).toEqual([])
  })

  it('does not miss any expected static key', () => {
    const registered = new Set(getRegisteredStaticKeys())
    const missing = Object.keys(EXPECTED_STATIC_KEYS).filter(
      (key) => !registered.has(key)
    )
    expect(missing).toEqual([])
  })

  it('registers exactly the expected dynamic key families', () => {
    expect([...getRegisteredDynamicKeyFamilyPrefixes()].sort()).toEqual(
      Object.keys(EXPECTED_DYNAMIC_KEY_FAMILIES).sort()
    )
    for (const [prefix, expected] of Object.entries(
      EXPECTED_DYNAMIC_KEY_FAMILIES
    )) {
      expect(resolveMmkvKeyPolicy(`${prefix}some-generated-id`)).toEqual(
        expected
      )
    }
  })

  it('resolves unknown keys to undefined (no permissive default)', () => {
    expect(resolveMmkvKeyPolicy('some-unknown-key')).toBeUndefined()
    expect(resolveMmkvKeyPolicy('')).toBeUndefined()
  })
})
