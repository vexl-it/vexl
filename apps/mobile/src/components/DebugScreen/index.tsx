import notifee, {AndroidGroupAlertBehavior} from '@notifee/react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type Inbox} from '@vexl-next/domain/src/general/messaging'
import {newOfferId, OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {MINIMAL_DATE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {fetchAndEncryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/fetchAndEncryptNotificationToken'
import {FeedbackFormId} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {
  ChevronLeft,
  NavigationBar,
  Screen,
  Typography,
  Button as UiButton,
  YStack,
} from '@vexl-next/ui'
import {
  Array,
  Effect,
  pipe as effectPipe,
  Either,
  HashMap,
  Schema,
} from 'effect'
import * as BackgroundTask from 'expo-background-task'
import {getInstallationSource} from 'expo-installation-source'
import * as TaskManager from 'expo-task-manager'
import {isTestFlight} from 'expo-testflight'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import React from 'react'
import {Alert, Platform} from 'react-native'
import {apiAtom, apiEnv} from '../../api'
import {type RootStackScreenProps} from '../../navigationTypes'
import allChatsAtom from '../../state/chat/atoms/allChatsAtom'
import {sendUpdateNoticeMessageActionAtom} from '../../state/chat/atoms/checkAndReportCurrentVersionToChatsActionAtom'
import deleteAllInboxesActionAtom from '../../state/chat/atoms/deleteAllInboxesActionAtom'
import fetchMessagesForAllInboxesAtom from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import focusChatByInboxKeyAndSenderKey from '../../state/chat/atoms/focusChatByInboxKeyAndSenderKey'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {upsertInboxOnBeAndLocallyActionAtom} from '../../state/chat/hooks/useCreateInbox'
import connectionStateAtom, {
  syncConnectionsActionAtom,
} from '../../state/connections/atom/connectionStateAtom'
import offerToConnectionsAtom, {
  deleteOrphanRecordsActionAtom,
  updateAndReencryptAllOffersConnectionsActionAtom,
} from '../../state/connections/atom/offerToConnectionsAtom'
import {storedContactsAtom} from '../../state/contacts/atom/contactsStore'
import {StoredContact} from '../../state/contacts/domain'
import {btcPriceDataAtom} from '../../state/currentBtcPriceAtoms'
import {createOfferActionAtom} from '../../state/marketplace/atoms/createOfferActionAtom'
import {myOffersAtom} from '../../state/marketplace/atoms/myOffers'
import {
  clubOffersNextPageParamAtom,
  contactOffersNextPageParamAtom,
  offersAtom,
  offersStateAtom,
} from '../../state/marketplace/atoms/offersState'
import {
  alertAndReportInPersonOffersWithoutLocation,
  reportOffersWithoutLocationActionAtom,
} from '../../state/marketplace/atoms/offersToSeeInMarketplace'
import {refreshOffersActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom'
import {getNewContactNetworkOffersAndDecryptPaginatedActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom/utils/getNewOffersAndDecrypt'
import {vexlNotificationTokenAtom} from '../../state/notifications/vexlNotificationTokenAtom'
import {resetPostLoginFlowProgressActionAtom} from '../../state/postLoginOnboarding'
import {
  sessionDataOrDummyAtom,
  useSessionAssumeLoggedIn,
} from '../../state/session'
import {andThenExpectVoidNoErrors} from '../../utils/andThenExpectNoErrors'
import {
  commitHash,
  enableHiddenFeatures,
  packageName,
  platform,
  version,
  versionCode,
} from '../../utils/environment'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../utils/notifications'
import {getChannelForMessages} from '../../utils/notifications/notificationChannels'
import {
  getShowDebugNotifications,
  setShowDebugNotifications,
} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {isDeveloperAtom, showTextDebugButtonAtom} from '../../utils/preferences'
import reportError from '../../utils/reportError'
import {startMeasure} from '../../utils/reportTime'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {askAreYouSureActionAtom} from '../GlobalDialog'
import deleteInboxAtom from './atoms/deleteInboxAtom'
import {ActionBenchmarks} from './components/ActionBenchmarks'
import AfterInteractionTaskDemo from './components/AfterInteractionTaskDemo'
import CryptoBenchmarks from './components/CryptoBenchmarks'
import LanguagePicker from './components/LanguagePicker'
import NewCrypto from './components/NewCrypto'
import Preferences from './components/Preferences'
import SimulateMissingOfferInbox from './components/SimulateMissingOfferInbox'
import {
  generateTestContacts,
  NUMBER_OF_TEST_CONTACTS,
} from './utils/generateTestContacts'

const DEBUG_EUROPE_OFFERS_PREFIX = 'debug-europe-offer-'

const DEFAULT_EUROPE_DEBUG_LOCATION = {
  name: 'Prague',
  latitude: 50.0755,
  longitude: 14.4378,
}

const EUROPE_DEBUG_LOCATIONS = [
  {name: 'Lisbon', latitude: 38.7223, longitude: -9.1393},
  {name: 'Madrid', latitude: 40.4168, longitude: -3.7038},
  {name: 'Barcelona', latitude: 41.3874, longitude: 2.1686},
  {name: 'Paris', latitude: 48.8566, longitude: 2.3522},
  {name: 'Brussels', latitude: 50.8503, longitude: 4.3517},
  {name: 'Amsterdam', latitude: 52.3676, longitude: 4.9041},
  {name: 'London', latitude: 51.5072, longitude: -0.1276},
  {name: 'Dublin', latitude: 53.3498, longitude: -6.2603},
  {name: 'Oslo', latitude: 59.9139, longitude: 10.7522},
  {name: 'Stockholm', latitude: 59.3293, longitude: 18.0686},
  {name: 'Copenhagen', latitude: 55.6761, longitude: 12.5683},
  {name: 'Berlin', latitude: 52.52, longitude: 13.405},
  {name: 'Munich', latitude: 48.1351, longitude: 11.582},
  {name: 'Zurich', latitude: 47.3769, longitude: 8.5417},
  {name: 'Milan', latitude: 45.4642, longitude: 9.19},
  {name: 'Rome', latitude: 41.9028, longitude: 12.4964},
  {name: 'Vienna', latitude: 48.2082, longitude: 16.3738},
  {name: 'Prague', latitude: 50.0755, longitude: 14.4378},
  {name: 'Warsaw', latitude: 52.2297, longitude: 21.0122},
  {name: 'Budapest', latitude: 47.4979, longitude: 19.0402},
  {name: 'Bratislava', latitude: 48.1486, longitude: 17.1077},
  {name: 'Ljubljana', latitude: 46.0569, longitude: 14.5058},
  {name: 'Zagreb', latitude: 45.815, longitude: 15.9819},
  {name: 'Athens', latitude: 37.9838, longitude: 23.7275},
  {name: 'Bucharest', latitude: 44.4268, longitude: 26.1025},
]

type DebugButtonProps = Omit<
  React.ComponentProps<typeof UiButton>,
  'children'
> & {
  readonly text: string
}

function Button({text, ...props}: DebugButtonProps): React.JSX.Element {
  return <UiButton {...props}>{text}</UiButton>
}

function DebugLabel({
  children,
  userSelect,
}: {
  readonly children: React.ReactNode
  readonly userSelect?: 'auto'
}): React.JSX.Element {
  return (
    <Typography
      variant="paragraphSmall"
      color="$foregroundPrimary"
      userSelect={userSelect}
    >
      {children}
    </Typography>
  )
}

function createDebugEuropeOfferPublicPart({
  index,
  offerPublicKey,
}: {
  index: number
  offerPublicKey: PublicKeyPemBase64
}): OfferPublicPart {
  const city =
    EUROPE_DEBUG_LOCATIONS[index % EUROPE_DEBUG_LOCATIONS.length] ??
    DEFAULT_EUROPE_DEBUG_LOCATION
  const groupIndex = Math.floor(index / EUROPE_DEBUG_LOCATIONS.length)
  const latitudeOffset = ((groupIndex % 4) - 1.5) * 0.18
  const longitudeOffset = (((index + groupIndex) % 5) - 2) * 0.22

  return Schema.decodeSync(OfferPublicPart)({
    offerPublicKey,
    location: [
      {
        placeId: `${DEBUG_EUROPE_OFFERS_PREFIX}place-${index}`,
        latitude: city.latitude + latitudeOffset,
        longitude: city.longitude + longitudeOffset,
        radius: 0.15,
        address: `${city.name} debug location ${index + 1}`,
        shortAddress: city.name,
      },
    ],
    offerDescription: `Debug Europe offer ${index + 1}`,
    amountBottomLimit: 10_000,
    amountTopLimit: 100_000,
    feeState: 'WITHOUT_FEE',
    feeAmount: 0,
    locationState: ['IN_PERSON'],
    paymentMethod: ['CASH'],
    btcNetwork: ['LIGHTING', 'ON_CHAIN'],
    currency: 'EUR',
    spokenLanguages: ['ENG'],
    expirationDate: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    offerType: index % 2 === 0 ? 'SELL' : 'BUY',
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: 'EUR',
    active: true,
    groupUuids: [],
    listingType: 'BITCOIN',
    authorClientVersion: version,
  })
}

function DebugScreen(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const store = useStore()
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()

  const setConnectionsState = useSetAtom(connectionStateAtom)
  const refreshMessaging = useSetAtom(fetchMessagesForAllInboxesAtom)
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const updateConnections = useSetAtom(
    updateAndReencryptAllOffersConnectionsActionAtom
  )
  const deleteInbox = useSetAtom(deleteInboxAtom)
  const deleteAllInboxes = useSetAtom(deleteAllInboxesActionAtom)
  const isDeveloper = useAtomValue(isDeveloperAtom)
  const showTextDebugButton = useSetAtom(showTextDebugButtonAtom)
  const getNewContactNetworkOffersAndDecryptPaginated = useSetAtom(
    getNewContactNetworkOffersAndDecryptPaginatedActionAtom
  )
  const resetPostLoginFlowProgress = useSetAtom(
    resetPostLoginFlowProgressActionAtom
  )
  const notificationToken = useAtomValue(vexlNotificationTokenAtom)

  if (!isDeveloper) {
    const buttonText = !isDeveloper
      ? 'Show translators debug button'
      : 'Hide translators debug button'
    return (
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title="Debug screen"
            leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
          />
        }
      >
        <YStack gap="$4">
          <Button
            variant="secondary"
            size="small"
            onPress={() => {
              showTextDebugButton((old) => !old)
            }}
            text={buttonText}
          />
          <LanguagePicker />
          <Button variant="secondary" text="back" onPress={safeGoBack} />
        </YStack>
      </Screen>
    )
  }

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title="Debug screen"
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
      footer={<Button variant="secondary" text="back" onPress={safeGoBack} />}
    >
      <YStack gap="$4">
        <YStack gap="$3">
          <DebugLabel>
            App version: {version} ({versionCode})
          </DebugLabel>
          <DebugLabel userSelect="auto">On Commit: {commitHash}</DebugLabel>
          <DebugLabel>__DEV__: {__DEV__}</DebugLabel>
          <CryptoBenchmarks />
          <DebugLabel>
            enableHiddenFeatures: {enableHiddenFeatures ? 'true' : 'false'}
          </DebugLabel>
          <DebugLabel>apiEnv: {JSON.stringify(apiEnv, null, 2)}</DebugLabel>
          <DebugLabel>
            notficationSecretState: {JSON.stringify(notificationToken, null, 2)}
          </DebugLabel>
          <NewCrypto />
          <ActionBenchmarks />
          <LanguagePicker />
          <Button
            variant="primary"
            size="small"
            text="Reset post-login flow progress"
            onPress={() => {
              resetPostLoginFlowProgress()
              Alert.alert('Post-login flow progress reset')
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Refresh connectionss"
            onPress={() => {
              Effect.runFork(
                Effect.gen(function* (_) {
                  yield* store.set(syncConnectionsActionAtom)

                  const connectionState = store.get(connectionStateAtom)
                  console.log(connectionState)
                })
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Print contacts"
            onPress={() => {
              const contacts = store.get(storedContactsAtom)
              console.log('Contacts: ', JSON.stringify(contacts, null, 2))
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Simulate non fatal error Error A"
            onPress={() => {
              reportError(
                'error',
                new Error('Simulated non fatal error A'),
                // Private key should be stripped
                {
                  text: `Simulated non fatal error ${session.privateKey.privateKeyPemBase64}`,
                }
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Simulate non fatal error Error B"
            onPress={() => {
              reportError(
                'error',
                new Error('Simulated non fatal error B'),
                // Private key should be stripped
                {
                  text: `Simulated non fatal error ${session.privateKey.privateKeyPemBase64}`,
                }
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Simulate fatal error"
            onPress={() => {
              throw new Error(`Simulated fatal error`)
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Report offers without location"
            onPress={() => {
              store.set(reportOffersWithoutLocationActionAtom)
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Clear offers state"
            onPress={() => {
              store.set(offersStateAtom, {
                lastUpdatedAt2: MINIMAL_DATE,
                offers: [],
                contactOffersNextPageParam: undefined,
                clubOffersNextPageParam: {},
              })
              Alert.alert('Done')
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Create 100 server debug offers around Europe"
            onPress={() => {
              if (packageName === 'it.vexl.next') {
                Alert.alert('Not available in production')
                return
              }

              Alert.alert(
                'Started',
                'Creating 100 offers on the server. This can take a while.'
              )

              pipe(
                Effect.forEach(
                  Array.range(0, 99),
                  (index) =>
                    Effect.gen(function* (_) {
                      const offerId = newOfferId()
                      const inbox = yield* _(
                        store.set(upsertInboxOnBeAndLocallyActionAtom, {
                          for: 'myOffer',
                          offerId,
                        })
                      )

                      return yield* _(
                        store.set(createOfferActionAtom, {
                          offerId,
                          payloadPublic: createDebugEuropeOfferPublicPart({
                            index,
                            offerPublicKey:
                              inbox.inbox.privateKey.publicKeyPemBase64,
                          }),
                          intendedConnectionLevel: 'ALL',
                          intendedClubs: [],
                          offerKey: inbox.inbox.privateKey,
                          onProgress: (progress) => {
                            console.log(
                              `Creating debug Europe offer ${
                                index + 1
                              }/100: ${JSON.stringify(progress)}`
                            )
                          },
                        })
                      )
                    }),
                  {concurrency: 1}
                ),
                Effect.tap((createdOffers) =>
                  Effect.sync(() => {
                    Alert.alert(
                      'Done',
                      `Created ${createdOffers.length} all-friends offers around Europe`
                    )
                  })
                ),
                Effect.tapError((error) =>
                  Effect.sync(() => {
                    console.error('Error creating debug Europe offers', error)
                    Alert.alert(
                      'Error',
                      JSON.stringify(error, null, 2).slice(0, 1000)
                    )
                  })
                ),
                Effect.runFork
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Test get first page of offers and alert number"
            onPress={() => {
              void pipe(
                effectToTaskEither(
                  getNewContactNetworkOffersAndDecryptPaginated({
                    keyPair: session.privateKey,
                    keyPairV2: session.keyPairV2,
                    offersApi: store.get(apiAtom).offer,
                    lastPrivatePartIdBase64: undefined,
                  })
                ),
                TE.matchW(
                  (error) => {
                    Alert.alert('error', JSON.stringify(error, null, 2), [
                      {text: 'ok'},
                      {
                        text: 'copy to clipboard',
                        onPress: () => {
                          Clipboard.setString(JSON.stringify(error, null, 2))
                        },
                      },
                    ])
                  },
                  (result) => {
                    const errors = effectPipe(
                      Array.filterMap(result, Either.getLeft)
                    )
                    const success = effectPipe(
                      Array.filterMap(result, Either.getRight)
                    )

                    Alert.alert(
                      'success',
                      `done got: ${success.length} success and ${errors.length} errors`,
                      [
                        {
                          text: 'ok',
                        },
                        {
                          text: 'Check and copy to clipboard',
                          onPress: () => {
                            alertAndReportInPersonOffersWithoutLocation(
                              success,
                              true,
                              true
                            )
                          },
                        },
                      ]
                    )
                  }
                )
              )()
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="show not"
            onPress={() => {
              void (async () => {
                if (Platform.OS === 'android') {
                  await notifee.displayNotification({
                    id: 'some',
                    title: 'summary',
                    subtitle: 'some summary',
                    android: {
                      smallIcon: 'notification_icon',
                      channelId: await getChannelForMessages(),
                      groupSummary: true,
                      groupId: 'some',
                      groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
                    },
                  })
                }
                await notifee.displayNotification({
                  id: 'nnn',
                  title: `title ${Date.now()}`,
                  subtitle: 'some notification',
                  ios: {
                    threadId: 'some',
                  },
                  android: {
                    smallIcon: 'notification_icon',
                    channelId: await getChannelForMessages(),
                    groupId: 'some',
                    groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
                  },
                })
              })()
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="cancel all not"
            onPress={() => {
              void (async () => {
                await notifee.cancelAllNotifications()
              })()
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="print all not"
            onPress={() => {
              void (async () => {
                const nots = await notifee.getDisplayedNotifications()
                console.log(JSON.stringify(nots, null, 2))
              })()
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Print contactOffersNextPageParamBase64"
            onPress={() => {
              Alert.alert(
                'Last updated at',
                `inState: ${store.get(
                  contactOffersNextPageParamAtom
                )}, minimalDate: ${MINIMAL_DATE}`
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Print clubOffersNextPageParamBase64"
            onPress={() => {
              Alert.alert(
                'Last updated at',
                `inState: ${JSON.stringify(
                  store.get(clubOffersNextPageParamAtom)
                )}, minimalDate: ${MINIMAL_DATE}`
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Clear messaging state"
            onPress={() => {
              const userInbox: Inbox = {privateKey: session.privateKey}

              store.set(messagingStateAtom, [{inbox: userInbox, chats: []}])
              Alert.alert('Done')
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Clear BTC price data state"
            onPress={() => {
              store.set(btcPriceDataAtom, {})
              Alert.alert('Done')
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Refresh chat state"
            onPress={() => {
              pipe(
                refreshMessaging(),
                Effect.andThen((r) => {
                  Alert.alert(r)
                }),
                Effect.runFork
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Open missing chat detail"
            onPress={() => {
              navigation.navigate('ChatDetail', {
                inboxKey: session.privateKey.publicKeyPemBase64,
                otherSideKey: Schema.decodeSync(PublicKeyPemBase64)(
                  'debug-chat-detail-that-does-not-exist'
                ),
              })
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Simulate losing ownership info"
            onPress={() => {
              store.set(offersAtom, (o) =>
                o.map((one) => ({...one, ownershipInfo: undefined}))
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Refresh offers state"
            onPress={() => {
              void Effect.runPromise(
                andThenExpectVoidNoErrors(() => {
                  Alert.alert('done')
                })(refreshOffers())
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="clear new contacts"
            onPress={() => {
              store.set(storedContactsAtom, [])
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Reconstruct user inbox"
            onPress={() => {
              store.set(messagingStateAtom, (old) => [
                ...old.filter(
                  (one) =>
                    one.inbox.privateKey.publicKeyPemBase64 !==
                    session.privateKey.publicKeyPemBase64
                ),
                {
                  inbox: {
                    privateKey: session.privateKey,
                  },
                  chats: [],
                },
              ])
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Delete offer connections without offer"
            onPress={() => {
              store.set(deleteOrphanRecordsActionAtom)
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Print offer and chat state into console"
            onPress={() => {
              const offers = store.get(offersStateAtom)
              const messagingState = store.get(messagingStateAtom)
              const connectionState = store.get(offerToConnectionsAtom)
              console.log({offers, messagingState, connectionState})
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Print my offers into console"
            onPress={() => {
              const offers = store.get(myOffersAtom)
              console.log(JSON.stringify(offers, null, 2))
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Delete user inbox"
            onPress={() =>
              deleteInbox(session.privateKey).pipe(
                Effect.tap((result) => {
                  if (result) {
                    Alert.alert('done')
                  } else {
                    Alert.alert('error')
                  }
                }),
                Effect.runFork
              )
            }
          />

          <Button
            variant="primary"
            size="small"
            text="Delete all inboxes"
            onPress={() => {
              void pipe(
                deleteAllInboxes(),
                T.map((result) => {
                  if (result) {
                    Alert.alert('done')
                  } else {
                    Alert.alert('error')
                  }
                })
              )()
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Send version update to all chats"
            onPress={() => {
              Effect.runFork(
                Effect.gen(function* (_) {
                  const allChats = store.get(allChatsAtom).flat()
                  const sendUpdate = Array.map(allChats, (one) => {
                    const inboxAtom = focusChatByInboxKeyAndSenderKey({
                      inboxKey: one.chat.inbox.privateKey.publicKeyPemBase64,
                      senderKey: one.chat.otherSide.publicKey,
                    })
                    return store.set(
                      sendUpdateNoticeMessageActionAtom,
                      inboxAtom
                    )
                  })
                  yield* _(Effect.all(sendUpdate))
                })
              )
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Update all offers connections"
            onPress={() => {
              Effect.runFork(updateConnections({isInBackground: false}))
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Copy public key"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={async () => {
              Clipboard.setString(
                store.get(sessionDataOrDummyAtom).privateKey.publicKeyPemBase64
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Copy notification token"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={async () => {
              Clipboard.setString(
                (await Effect.runPromise(getNotificationTokenE())) ?? 'No token'
              )
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Print background tasks"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={async () => {
              const registeredTasks =
                await TaskManager.getRegisteredTasksAsync()
              console.log(JSON.stringify(registeredTasks, null, 2))
              Alert.alert(
                'Registered tasks',
                JSON.stringify(registeredTasks, null, 2),
                [
                  {
                    text: 'copy',
                    onPress: () => {
                      Clipboard.setString(
                        JSON.stringify(registeredTasks, null, 2)
                      )
                    },
                  },
                  {
                    text: 'calcel',
                  },
                ]
              )
            }}
          />

          {/* Testing background tasks is only available in dev mode */}
          {!!__DEV__ && (
            <Button
              variant="primary"
              size="small"
              text="Run test background tasks"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={async () => {
                await BackgroundTask.triggerTaskWorkerForTestingAsync()
              }}
            />
          )}

          <Button
            variant="primary"
            size="small"
            text="Create and Copy notification cypher"
            onPress={() => {
              Effect.runFork(
                Effect.gen(function* (_) {
                  const notificationToken = yield* _(getNotificationTokenE())
                  if (!notificationToken) {
                    yield* _(
                      Effect.sync(() => {
                        Alert.alert('No notification token')
                      })
                    )
                    return
                  }

                  const cypher = yield* _(
                    fetchAndEncryptNotificationToken({
                      clientPlatform: platform,
                      clientVersion: versionCode,
                      expoToken: notificationToken,
                      notificationApi: store.get(apiAtom).notification,
                      locale: t('localeName'),
                    })
                  )

                  yield* _(
                    Effect.sync(() => {
                      Clipboard.setString(cypher)
                      Alert.alert('Copied')
                    })
                  )
                })
              )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Simulate offers deleted from server"
            onPress={() => {
              void effectToTaskEither(
                store.get(apiAtom).offer.deleteOffer({
                  adminIds: store
                    .get(myOffersAtom)
                    .map((one) => one.ownershipInfo?.adminId)
                    .filter((one): one is NonNullable<typeof one> => !!one),
                })
              )()
                .then(() => {
                  Alert.alert('done')
                })
                .catch((error) => {
                  Alert.alert('Error', error.message)
                })
            }}
          />

          <Button
            variant="primary"
            size="small"
            text="Test dummy feedback request"
            onPress={() => {
              void effectToTaskEither(
                store.get(apiAtom).feedback.submitFeedback({
                  formId: Schema.decodeSync(FeedbackFormId)(generateUuid()),
                  type: 'create',
                  stars: 5,
                  textComment: 'from test',
                })
              )()
                .then(() => {
                  Alert.alert('done')
                })
                .catch((error) => {
                  Alert.alert('Error', error.message)
                })
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Toggle debug notifications"
            onPress={() => {
              setShowDebugNotifications(!getShowDebugNotifications())
              Alert.alert(getShowDebugNotifications() ? 'Enabled' : 'Disabled')
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Simulate reach drop to 0"
            onPress={() => {
              setConnectionsState({
                lastUpdate: Schema.decodeSync(UnixMilliseconds)(
                  DateTime.now().toMillis()
                ),
                firstLevel: [],
                secondLevel: [],
                commonFriends: HashMap.empty(),
                verifiedFriends: HashMap.empty(),
              })
              Alert.alert('Done')
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Show are you sure thing"
            onPress={() => {
              store
                .set(askAreYouSureActionAtom, {
                  variant: 'info',
                  steps: [
                    {
                      type: 'StepWithText',
                      title: 'Are you sure?',
                      description: 'This is a description',
                      negativeButtonText: 'Cancel',
                      positiveButtonText: 'Yes, I am sure',
                    },
                  ],
                })
                .pipe(Effect.runFork)
            }}
          />
          <Button
            variant="primary"
            size="small"
            text="Show installation source"
            onPress={() => {
              if (Platform.OS === 'android')
                Alert.alert(getInstallationSource() ?? 'none')
              else
                Alert.alert(
                  `ios: ${isTestFlight ? 'TestFlight' : 'Not testflight'}`
                )
            }}
          />
          <Button
            variant="primary"
            size="small"
            text={`(Effect) Generate and measure decoding of ${NUMBER_OF_TEST_CONTACTS} contacts`}
            onPress={() => {
              Effect.gen(function* (_) {
                const contacts = generateTestContacts()
                const measureDecodingContacts = startMeasure(
                  `Measure decoding large amount of ${NUMBER_OF_TEST_CONTACTS} contacts`
                )

                const result = pipe(
                  contacts,
                  Schema.decodeSync(
                    Schema.parseJson(Schema.Array(StoredContact))
                  )
                )

                const time = measureDecodingContacts()
                Alert.alert(`In ${time}s decoded ${result.length} contacts`)
              }).pipe(
                Effect.tapError((e) =>
                  Effect.sync(() => {
                    Alert.alert('Error')
                  })
                ),
                Effect.tapDefect((e) =>
                  Effect.sync(() => {
                    Alert.alert('Defect')
                  })
                ),
                Effect.runFork
              )
            }}
          />
        </YStack>
        <SimulateMissingOfferInbox />
        <Preferences />
        <AfterInteractionTaskDemo />
      </YStack>
    </Screen>
  )
}

export default DebugScreen
