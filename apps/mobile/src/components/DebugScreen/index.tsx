import WhiteContainer from '../WhiteContainer'
import {Spacer, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import Screen from '../Screen'
import Button from '../Button'
import {useSetAtom, useStore} from 'jotai'
import {offersStateAtom} from '../../state/marketplace/atom'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {useSessionAssumeLoggedIn} from '../../state/session'
import {Alert, ScrollView} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import useFetchMessagesForAllInboxes from '../../state/chat/hooks/useFetchNewMessages'
import {useTriggerOffersRefresh} from '../../state/marketplace'
import {type Inbox} from '@vexl-next/domain/dist/general/messaging'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {enableHiddenFeatures} from '../../utils/environment'
import {apiEnv} from '../../api'
import CryptoBenchmarks from './components/CryptoBenchmarks'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import messaging from '@react-native-firebase/messaging'
import Preferences from './components/Preferences'

type Props = RootStackScreenProps<'DebugScreen'>

// const ContentScroll = styled(ScrollView, {
//   marginBottom: '$2',
//   contentContainerStyle: {
//     flex: 1,
//   },
// })

function DebugScreen({navigation}: Props): JSX.Element {
  const store = useStore()
  const session = useSessionAssumeLoggedIn()

  const refreshMessaging = useFetchMessagesForAllInboxes()
  const refreshOffers = useTriggerOffersRefresh()
  const updateConnections = useSetAtom(updateAllOffersConnectionsActionAtom)

  return (
    <Screen>
      <WhiteContainer>
        <ScrollView>
          <YStack space="$2">
            <Text fos={20} ff="$heading">
              Debug screen
            </Text>
            <CryptoBenchmarks />
            <Text>
              enableHiddenFeatures: {enableHiddenFeatures ? 'true' : 'false'}
            </Text>
            <Text>apiEnv: {JSON.stringify(apiEnv, null, 2)}</Text>

            <Spacer />
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
                void refreshMessaging()().then(() => {
                  Alert.alert('done')
                })
              }}
            />
            <Button
              variant={'primary'}
              size={'small'}
              text={'Refresh messages state'}
              onPress={() => {
                void refreshMessaging()().then(() => {
                  Alert.alert('done')
                })
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
                console.log({offers, messagingState})
              }}
            />

            <Button
              variant={'primary'}
              size={'small'}
              text={'Update all offers connections'}
              onPress={() => {
                void updateConnections()()
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
        <Button variant="secondary" text="back" onPress={navigation.goBack} />
      </WhiteContainer>
    </Screen>
  )
}

export default DebugScreen
