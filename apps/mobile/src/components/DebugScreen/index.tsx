import Clipboard from '@react-native-clipboard/clipboard'
import messaging from '@react-native-firebase/messaging'
import {type Inbox} from '@vexl-next/domain/src/general/messaging'
import {MINIMAL_DATE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {fetchAndEncryptFcmForOffer} from '@vexl-next/resources-utils/src/notifications/encryptFcmForOffer'
import getNewOffersAndDecrypt from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {isLeft, isRight} from 'fp-ts/lib/Either'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {Alert, ScrollView} from 'react-native'
import {Spacer, Text, YStack} from 'tamagui'
import {apiEnv, privateApiAtom} from '../../api'
import deleteAllInboxesActionAtom from '../../state/chat/atoms/deleteAllInboxesActionAtom'
import fetchMessagesForAllInboxesAtom from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import offerToConnectionsAtom, {
  deleteOrphanRecordsActionAtom,
  updateAllOffersConnectionsActionAtom,
} from '../../state/connections/atom/offerToConnectionsAtom'
import {storedContactsAtom} from '../../state/contacts/atom/contactsStore'
import {btcPriceDataAtom} from '../../state/currentBtcPriceAtoms'
import {triggerOffersRefreshAtom} from '../../state/marketplace'
import {myOffersAtom} from '../../state/marketplace/atoms/myOffers'
import {
  lastUpdatedAtAtom,
  offersAtom,
  offersStateAtom,
} from '../../state/marketplace/atoms/offersState'
import {
  alertAndReportOnlineOffersWithoutLocation,
  reportOffersWithoutLocationActionAtom,
} from '../../state/marketplace/atoms/offersToSeeInMarketplace'
import {
  sessionDataOrDummyAtom,
  useSessionAssumeLoggedIn,
} from '../../state/session'
import {
  commitHash,
  enableHiddenFeatures,
  version,
} from '../../utils/environment'
import {getNotificationToken} from '../../utils/notifications'
import {
  getShowDebugNotifications,
  setShowDebugNotifications,
} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {isDeveloperAtom, showTextDebugButtonAtom} from '../../utils/preferences'
import reportError from '../../utils/reportError'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import Screen from '../Screen'
import WhiteContainer from '../WhiteContainer'
import deleteInboxAtom from './atoms/deleteInboxAtom'
import AfterInteractionTaskDemo from './components/AfterInteractionTaskDemo'
import CryptoBenchmarks from './components/CryptoBenchmarks'
import LanguagePicker from './components/LanguagePicker'
import Preferences from './components/Preferences'
import RemoteConfigView from './components/RemoteConfigView'
import SimulateMissingOfferInbox from './components/SimulateMissingOfferInbox'

// const ContentScroll = styled(ScrollView, {
//   marginBottom: '$2',
//   contentContainerStyle: {
//     flex: 1,
//   },
// })

function DebugScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const store = useStore()
  const session = useSessionAssumeLoggedIn()

  const refreshMessaging = useSetAtom(fetchMessagesForAllInboxesAtom)
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const updateConnections = useSetAtom(updateAllOffersConnectionsActionAtom)
  const deleteInbox = useSetAtom(deleteInboxAtom)
  const deleteAllInboxes = useSetAtom(deleteAllInboxesActionAtom)
  const isDeveloper = useAtomValue(isDeveloperAtom)
  const showTextDebugButton = useSetAtom(showTextDebugButtonAtom)

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
          <YStack space="$2">
            <Text color="$black" fos={20} ff="$heading">
              Debug screen
            </Text>
            <Text color="$black">App version: {version}</Text>
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
            <RemoteConfigView />
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
                  lastUpdatedAt1: MINIMAL_DATE,
                  offers: [],
                })
                Alert.alert('Done')
              }}
            />
            <Button
              variant="primary"
              size="small"
              text="Test get all offers and alert number"
              onPress={() => {
                void pipe(
                  getNewOffersAndDecrypt({
                    keyPair: session.privateKey,
                    modifiedAt: MINIMAL_DATE,
                    offersApi: store.get(privateApiAtom).offer,
                  }),
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
                      const errors = result
                        .filter(isLeft)
                        .map((one) => one.left)
                      const success = result
                        .filter(isRight)
                        .map((one) => one.right)
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
              text="Print lastUpdatedAtAtom"
              onPress={() => {
                Alert.alert(
                  'Last updated at',
                  `inState: ${store.get(
                    lastUpdatedAtAtom
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
                void pipe(
                  refreshMessaging(),
                  T.map((result) => {
                    if (result === 'done') {
                      Alert.alert('done')
                    }
                  })
                )()
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
              text="Refresh messages state"
              onPress={() => {
                void pipe(
                  refreshMessaging(),
                  T.map((result) => {
                    if (result === 'done') {
                      Alert.alert('done')
                    }
                  })
                )()
              }}
            />
            <Button
              variant="primary"
              size="small"
              text="Refresh offers state"
              onPress={() => {
                void refreshOffers().then(() => {
                  Alert.alert('done')
                })
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
              onPress={() => {
                void pipe(
                  deleteInbox(session.privateKey),
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
              text="Update all offers connections"
              onPress={() => {
                void updateConnections({isInBackground: false})()
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
                  (await messaging().getToken()) || 'No token'
                )
              }}
            />

            <Button
              variant="primary"
              size="small"
              text="Create and Copy notification cypher"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={async () => {
                void pipe(
                  TE.fromTask(getNotificationToken()),
                  TE.filterOrElseW(
                    (a): a is NonNullable<typeof a> => !!a,
                    () => ({
                      _tag: 'no token',
                    })
                  ),
                  TE.chainW((fcmToken) =>
                    fetchAndEncryptFcmForOffer({
                      fcmToken,
                      notificationApi: store.get(privateApiAtom).notification,
                    })
                  ),
                  TE.map((one) => {
                    Clipboard.setString(one)
                    Alert.alert('Copied')
                    return one
                  })
                )()
              }}
            />
            <Button
              variant="primary"
              size="small"
              text="Simulate offers deleted from server"
              onPress={() => {
                void store
                  .get(privateApiAtom)
                  .offer.deleteOffer({
                    adminIds: store
                      .get(myOffersAtom)
                      .map((one) => one.ownershipInfo.adminId),
                  })()
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
