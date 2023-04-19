import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import {type InsideTabScreenProps} from '../../../../navigationTypes'
import {Stack, Text} from 'tamagui'
import {useChatsToDisplayInList} from '../../../../state/chat/hooks/useChats'
import {TouchableWithoutFeedback} from 'react-native'
import useFetchMessagesForAllInboxes from '../../../../state/chat/hooks/useFetchNewMessages'
import {useCallback} from 'react'
import {useAppState} from '../../../../utils/useAppState'

type Props = InsideTabScreenProps<'Messages'>

function MessagesScreen({navigation}: Props): JSX.Element {
  const chats = useChatsToDisplayInList()
  const fetchNewMessages = useFetchMessagesForAllInboxes()

  useAppState(
    useCallback(() => {
      void fetchNewMessages()()
    }, [fetchNewMessages])
  )

  return (
    <ContainerWithTopBorderRadius scrollView={true} withTopPadding>
      {chats.map((chat) => (
        <TouchableWithoutFeedback
          key={chat.id}
          onPress={() => {
            navigation.push('ChatDetail', {chatId: chat.id})
          }}
        >
          <Stack>
            <Text col="$white">
              message: {chat.messages.at(0)?.message.text}
            </Text>
          </Stack>
        </TouchableWithoutFeedback>
      ))}
    </ContainerWithTopBorderRadius>
  )
}

export default MessagesScreen
