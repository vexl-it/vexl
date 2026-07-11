/**
 * Eagerly imports every module that declares a persisted MMKV key or dynamic
 * key family, purely for their `registerMmkvKey` /
 * `registerDynamicMmkvKeyFamily` side effects.
 *
 * Registration happens at module evaluation time, and Metro's inline-requires
 * evaluates modules lazily — a module that no rendered code has required yet
 * has NOT registered its keys. The snapshot exporter, the fresh-install
 * check, and staging verification all resolve keys through the registry and
 * treat unknown keys as fatal, so they must not depend on which screens
 * happened to be mounted before migration started. Importing this module
 * makes the registry complete deterministically.
 *
 * Keep this list in sync with the registry tripwire test
 * (`utils/atomUtils/registryInventory.test.ts`), which asserts the exact
 * key → policy inventory produced by these imports.
 *
 * Tests of migration modules stub this module out with
 * `jest.mock('./ensurePersistenceModulesRegistered', () => ({}))` and
 * register a controlled inventory instead.
 */
import '../../../components/AppLogsScreen/utils/storage'
import '../../../components/ChatDetailScreen/atoms/createHideActionForMessageMmkvAtom'
import '../../../components/FullscreenWarningScreen/state'
import '../../../components/NotificationsScreen/state/notificationScreenDataAtoms'
import '../../../components/NotificationsScreen/state/vexlProductNotifications'
import '../../../components/VersionMigrations/atoms'
import '../../../components/VersionMigrations/migrations/contacts'
import '../../../state/ActionBenchmarks'
import '../../../state/accountStatsAtom'
import '../../../state/chat/atoms/messagingStateAtom'
import '../../../state/chat/atoms/reportMessagesReceivedActionAtom'
import '../../../state/chat/atoms/showVexlbotInitialMessageForAllChatsAtom'
import '../../../state/clubs/atom/clubsToKeyHolderAtom'
import '../../../state/clubs/atom/clubsToKeyHolderV2Atom'
import '../../../state/clubs/atom/clubsWithMembersAtom'
import '../../../state/clubs/atom/removedClubsAtom'
import '../../../state/connections/atom/connectionStateAtom'
import '../../../state/connections/atom/noteToConnectionsAtom'
import '../../../state/connections/atom/offerToConnectionsAtom'
import '../../../state/connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import '../../../state/connections/atom/repostToConnectionsAtom'
import '../../../state/contacts/atom/contactsStore'
import '../../../state/currentBtcPriceAtoms'
import '../../../state/donations/atom'
import '../../../state/lastRouteMmkvAtom'
import '../../../state/marketplace/atoms/filterAtoms'
import '../../../state/marketplace/atoms/myOffers'
import '../../../state/marketplace/atoms/offerSuggestionVisible'
import '../../../state/marketplace/atoms/offersMissingOnServer'
import '../../../state/marketplace/atoms/offersState'
import '../../../state/notes/atoms/notesState'
import '../../../state/notifications/fcmCypherToKeyHolderAtom'
import '../../../state/notifications/fcmServerPublicKeyStore'
import '../../../state/notifications/vexlNotificationTokenAtom'
import '../../../state/notifications/vexlTokenToKeyHolderAtom'
import '../../../state/numberOfLoginAttemptsMmkvAtom'
import '../../../state/postLoginOnboarding'
import '../../../state/session/utils/v2SecretStorageFlag'
import '../../../state/tradeChecklist/atoms/vexlCalendarStorageAtom'
import '../../../state/tradeReminders/atoms/tradeRemindersAtom'
import '../../atomUtils/atomWithParsedMmkvStorage'
import '../../deepLinks'
import '../../lastTimeAppWasRunning'
import '../../mmkv/detectMmkvDataLoss'
import '../../newOffersNotificationBackgroundTask/store'
import '../../notifications'
import '../../notifications/cancelNewChatNotifications'
import '../../notifications/showDebugNotificationIfEnabled'
import '../../prPreview'
import '../../preferences'
