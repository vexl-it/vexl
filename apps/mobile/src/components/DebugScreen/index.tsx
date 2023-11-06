import WhiteContainer from '../WhiteContainer'
import {Spacer, Text, YStack} from 'tamagui'
import Screen from '../Screen'
import Button from '../Button'
import {useSetAtom, useStore} from 'jotai'
import {offersStateAtom} from '../../state/marketplace/atom'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {useSessionAssumeLoggedIn} from '../../state/session'
import {Alert, ScrollView} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {triggerOffersRefreshAtom} from '../../state/marketplace'
import {type Inbox} from '@vexl-next/domain/dist/general/messaging'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {enableHiddenFeatures} from '../../utils/environment'
import {apiEnv} from '../../api'
import CryptoBenchmarks from './components/CryptoBenchmarks'
import offerToConnectionsAtom, {
  updateAllOffersConnectionsActionAtom,
} from '../../state/connections/atom/offerToConnectionsAtom'
import messaging from '@react-native-firebase/messaging'
import Preferences from './components/Preferences'
import useSafeGoBack from '../../utils/useSafeGoBack'
import reportError from '../../utils/reportError'
import {importedContactsAtom} from '../../state/contacts'
import LanguagePicker from './components/LanguagePicker'
import RemoteConfigView from './components/RemoteConfigView'
import fetchMessagesForAllInboxesAtom from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import deleteInboxAtom from './atoms/deleteInboxAtom'
import deleteAllInboxesActionAtom from '../../state/chat/atoms/deleteAllInboxesActionAtom'

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

  return (
    <Screen>
      <WhiteContainer>
        <ScrollView>
          <YStack space="$2">
            <Text color="$black" fos={20} ff="$heading">
              Debug screen
            </Text>
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
              variant={'primary'}
              size={'small'}
              text={'Print contacts'}
              onPress={() => {
                const contacts = store.get(importedContactsAtom)
                console.log('Contacts: ', JSON.stringify(contacts, null, 2))
              }}
            />
            <Button
              variant={'primary'}
              size={'small'}
              text={'Simulate non fatal error'}
              onPress={() => {
                reportError(
                  'error',
                  // Private key should be stripped
                  `Simulated non fatal error ${session.privateKey.privateKeyPemBase64}`,
                  new Error('Simulated non fatal error')
                )
              }}
            />
            <Button
              variant={'primary'}
              size={'small'}
              text={'Simulate fatal error'}
              onPress={() => {
                throw new Error(`Simulated fatal error`)
              }}
            />
            <Button
              variant={'primary'}
              size={'small'}
              text={'Clear offers state'}
              onPress={() => {
                store.set(offersStateAtom, {
                  lastUpdatedAt: MINIMAL_DATE,
                  offers: [],
                })
                Alert.alert('Done')
              }}
            />
            <Button
              variant={'primary'}
              size={'small'}
              text={'Clear messaging state'}
              onPress={() => {
                const userInbox: Inbox = {privateKey: session.privateKey}

                store.set(messagingStateAtom, [{inbox: userInbox, chats: []}])
                Alert.alert('Done')
              }}
            />
            <Button
              variant={'primary'}
              size={'small'}
              text={'Refresh chat state'}
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
              variant={'primary'}
              size={'small'}
              text={'Refresh messages state'}
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
              variant={'primary'}
              size={'small'}
              text={'Refresh offers state'}
              onPress={() => {
                void refreshOffers().then(() => {
                  Alert.alert('done')
                })
              }}
            />

            <Button
              variant={'primary'}
              size={'small'}
              text={'Reconstruct user inbox'}
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
              variant={'primary'}
              size={'small'}
              text={'Print offer and chat state into console'}
              onPress={() => {
                const offers = store.get(offersStateAtom)
                const messagingState = store.get(messagingStateAtom)
                const connectionState = store.get(offerToConnectionsAtom)
                console.log({offers, messagingState, connectionState})
              }}
            />

            <Button
              variant={'primary'}
              size={'small'}
              text={'Delete user inbox'}
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
              variant={'primary'}
              size={'small'}
              text={'Delete all inboxes'}
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
              variant={'primary'}
              size={'small'}
              text={'Update all offers connections'}
              onPress={() => {
                void updateConnections({isInBackground: false})()
              }}
            />

            <Button
              variant={'primary'}
              size={'small'}
              text={'Copy notification token'}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={async () => {
                Clipboard.setString(
                  (await messaging().getToken()) || 'No token'
                )
              }}
            />
          </YStack>
          <Preferences />
        </ScrollView>
        <Button variant="secondary" text="back" onPress={safeGoBack} />
      </WhiteContainer>
    </Screen>
  )
}

export default DebugScreen
