import WhiteContainer from '../WhiteContainer'
import {ScrollView, Spacer, styled, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import Screen from '../Screen'
import Button from '../Button'
import {useStore} from 'jotai'
import {offersStateAtom} from '../../state/marketplace/atom'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {useSessionAssumeLoggedIn} from '../../state/session'
import {Alert} from 'react-native'
import useFetchMessagesForAllInboxes from '../../state/chat/hooks/useFetchNewMessages'
import {useTriggerOffersRefresh} from '../../state/marketplace'
import {type Inbox} from '@vexl-next/domain/dist/general/messaging'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'

type Props = RootStackScreenProps<'DebugScreen'>

const ContentScroll = styled(ScrollView, {
  marginBottom: '$2',
  contentContainerStyle: {
    flex: 1,
  },
})

function DebugScreen({navigation}: Props): JSX.Element {
  const store = useStore()
  const session = useSessionAssumeLoggedIn()

  const refreshMessaging = useFetchMessagesForAllInboxes()
  const refreshOffers = useTriggerOffersRefresh()

  return (
    <Screen>
      <WhiteContainer>
        <ContentScroll>
          <YStack space="$2">
            <Text fos={20} ff="$heading">
              Debug screen
            </Text>
            <Spacer />
            <Button
              variant={'primary'}
              small
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
              small
              text={'Clear messaging state'}
              onPress={() => {
                const userInbox: Inbox = {privateKey: session.privateKey}

                store.set(messagingStateAtom, [{inbox: userInbox, chats: []}])
                Alert.alert('Done')
              }}
            />
            <Button
              variant={'primary'}
              small
              text={'Refresh chat state'}
              onPress={() => {
                void refreshMessaging()().then(() => {
                  Alert.alert('done')
                })
              }}
            />
            <Button
              variant={'primary'}
              small
              text={'Refresh messages state'}
              onPress={() => {
                void refreshMessaging()().then(() => {
                  Alert.alert('done')
                })
              }}
            />
            <Button
              variant={'primary'}
              small
              text={'Refresh offers state'}
              onPress={() => {
                void refreshOffers().then(() => {
                  Alert.alert('done')
                })
              }}
            />

            <Button
              variant={'primary'}
              small
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
              small
              text={'Print offer and chat state into console'}
              onPress={() => {
                const offers = store.get(offersStateAtom)
                const messagingState = store.get(messagingStateAtom)
                console.log({offers, messagingState})
              }}
            />
          </YStack>
        </ContentScroll>
        <Button variant="secondary" text="back" onPress={navigation.goBack} />
      </WhiteContainer>
    </Screen>
  )
}

export default DebugScreen
