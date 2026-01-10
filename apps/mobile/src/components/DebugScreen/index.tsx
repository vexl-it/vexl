import notifee, {AndroidGroupAlertBehavior} from '@notifee/react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {type Inbox} from '@vexl-next/domain/src/general/messaging'
import {MINIMAL_DATE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {fetchAndEncryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/fetchAndEncryptNotificationToken'
import {FeedbackFormId} from '@vexl-next/rest-api/src/services/feedback/contracts'
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
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import {isTestFlight} from 'expo-testflight'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import React from 'react'
import {Alert, Platform, ScrollView} from 'react-native'
import {Spacer, Text, YStack} from 'tamagui'
import {apiAtom, apiEnv} from '../../api'
import allChatsAtom from '../../state/chat/atoms/allChatsAtom'
import {sendUpdateNoticeMessageActionAtom} from '../../state/chat/atoms/checkAndReportCurrentVersionToChatsActionAtom'
import deleteAllInboxesActionAtom from '../../state/chat/atoms/deleteAllInboxesActionAtom'
import fetchMessagesForAllInboxesAtom from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import focusChatByInboxKeyAndSenderKey from '../../state/chat/atoms/focusChatByInboxKeyAndSenderKey'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import connectionStateAtom from '../../state/connections/atom/connectionStateAtom'
import offerToConnectionsAtom, {
  deleteOrphanRecordsActionAtom,
  updateAndReencryptAllOffersConnectionsActionAtom,
} from '../../state/connections/atom/offerToConnectionsAtom'
import {storedContactsAtom} from '../../state/contacts/atom/contactsStore'
import {StoredContact} from '../../state/contacts/domain'
import {btcPriceDataAtom} from '../../state/currentBtcPriceAtoms'
import {myOffersAtom} from '../../state/marketplace/atoms/myOffers'
import {
  clubOffersNextPageParamAtom,
  contactOffersNextPageParamAtom,
  offersAtom,
  offersStateAtom,
} from '../../state/marketplace/atoms/offersState'
import {
  alertAndReportOnlineOffersWithoutLocation,
  reportOffersWithoutLocationActionAtom,
} from '../../state/marketplace/atoms/offersToSeeInMarketplace'
import {refreshOffersActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom'
import {getNewContactNetworkOffersAndDecryptPaginatedActionAtom} from '../../state/marketplace/atoms/refreshOffersActionAtom/utils/getNewOffersAndDecrypt'
import {
  sessionDataOrDummyAtom,
  useSessionAssumeLoggedIn,
} from '../../state/session'
import {andThenExpectVoidNoErrors} from '../../utils/andThenExpectNoErrors'
import {
  commitHash,
  enableHiddenFeatures,
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
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import Button from '../Button'
import Screen from '../Screen'
import WhiteContainer from '../WhiteContainer'
import deleteInboxAtom from './atoms/deleteInboxAtom'
import {ActionBenchmarks} from './components/ActionBenchmarks'
import AfterInteractionTaskDemo from './components/AfterInteractionTaskDemo'
import CryptoBenchmarks from './components/CryptoBenchmarks'
import LanguagePicker from './components/LanguagePicker'
import Preferences from './components/Preferences'
import SimulateMissingOfferInbox from './components/SimulateMissingOfferInbox'
import {
  generateTestContacts,
  NUMBER_OF_TEST_CONTACTS,
} from './utils/generateTestContacts'

// const ContentScroll = styled(ScrollView, {
//   marginBottom: '$2',
//   contentContainerStyle: {
//     flex: 1,
//   },
// })

function DebugScreen(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
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

  if (!isDeveloper) {
    const buttonText = !isDeveloper
      ? 'Show translators debug button'
      : 'Hide translators debug button'
    return (
      <Screen>
        <WhiteContainer>
          <Text color="$black" fos={20} ff="$heading">
            Debug screen
          </Text>
          <Spacer />
          <Button
            variant="secondary"
            size="small"
            onPress={() => {
              showTextDebugButton((old) => !old)
            }}
            text={buttonText}
          />
          <Spacer />
          <LanguagePicker />
          <Spacer />
          <Button variant="secondary" text="back" onPress={safeGoBack} />
        </WhiteContainer>
      </Screen>
    )
  }

  return (
    <Screen>
      <WhiteContainer>
        <ScrollView>
          <YStack gap="$2">
            <Text color="$black" fos={20} ff="$heading">
              Debug screen
            </Text>
            <Text color="$black">
              App version: {version} ({versionCode})
            </Text>
            <Text color="$black" selectable>
              On Commit: {commitHash}
            </Text>
            <Text color="$black">__DEV__: {__DEV__}</Text>
            <CryptoBenchmarks />
            <Text color="$black">
              enableHiddenFeatures: {enableHiddenFeatures ? 'true' : 'false'}
            </Text>
            <Text color="$black">
              apiEnv: {JSON.stringify(apiEnv, null, 2)}
            </Text>
            <Spacer />
            <ActionBenchmarks />
            <Spacer />
            <LanguagePicker />
            <Spacer />
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
              text="Test get first page of offers and alert number"
              onPress={() => {
                void pipe(
                  effectToTaskEither(
                    getNewContactNetworkOffersAndDecryptPaginated({
                      keyPair: session.privateKey,
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
                              alertAndReportOnlineOffersWithoutLocation(
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
                  store.get(sessionDataOrDummyAtom).privateKey
                    .publicKeyPemBase64
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
                  (
                    await Notifications.getExpoPushTokenAsync({
                      projectId: 'dbcc5b47-6c4a-4faf-a345-e9cd8a680c32',
                    })
                  ).data || 'No token'
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
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
                Alert.alert(
                  getShowDebugNotifications() ? 'Enabled' : 'Disabled'
                )
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
        </ScrollView>
        <Button variant="secondary" text="back" onPress={safeGoBack} />
      </WhiteContainer>
    </Screen>
  )
}

export default DebugScreen
