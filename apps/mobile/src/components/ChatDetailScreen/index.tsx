import {type RootStackScreenProps} from '../../navigationTypes'
import Screen from '../Screen'
import {ScrollView, Stack, Text} from 'tamagui'
import useSingleChat from '../../state/chat/hooks/useSingleChat'
import {useState} from 'react'
import Input from '../Input'
import Button from '../Button'
import useSendMessage from '../../state/chat/hooks/useSendMessage'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import useFetchMessagesForAllInboxes from '../../state/chat/hooks/useFetchNewMessages'
import useDeleteChat from '../../state/chat/hooks/useDeleteChat'
import {generateUuid} from '@vexl-next/domain/dist/utility/Uuid.brand'

type Props = RootStackScreenProps<'ChatDetail'>

function ChatDetailScreen({
  navigation,
  route: {
    params: {chatId},
  },
}: Props): JSX.Element {
  const chat = useSingleChat(chatId)
  const [text, setText] = useState('')
  const sendMessage = useSendMessage()
  const pullMessages = useFetchMessagesForAllInboxes()
  const deleteChat = useDeleteChat()

  if (!chat) {
    return <Text col="$white">Not exist</Text>
  }

  const {inbox} = chat

  return (
    <Screen>
      <ScrollView mx="$2">
        <Text col="$white">ChatId: {chatId}</Text>

        <Text fos={30} col="$white">
          Messages:{' '}
        </Text>
        {chat.messages.map((message) => (
          <Stack
            key={message.message.uuid}
            alignSelf={message.state === 'received' ? 'flex-start' : 'flex-end'}
          >
            <Text
              col={
                message.state === 'sending'
                  ? '$greyOnBlack'
                  : message.state === 'sendingError'
                  ? '$red'
                  : '$white'
              }
            >
              {message.message.text}
            </Text>
          </Stack>
        ))}
        <Input value={text} onChangeText={setText} />
        <Stack h="$2" />
        <Button
          disabled={text.trim() === ''}
          onPress={() => {
            const textToSend = text
            setText('')
            void sendMessage({
              chat,
              message: {
                text: textToSend,
                messageType: 'MESSAGE',
                uuid: generateUuid(),
                senderPublicKey: inbox.privateKey.publicKeyPemBase64,
                time: now(),
              },
            })()
          }}
          variant={'primary'}
          text={'submit'}
          small
        />
        <Button
          onPress={() => {
            void pullMessages()()
          }}
          small
          variant="primary"
          text="refresh"
        />
        <Button
          onPress={() => {
            navigation.goBack()
          }}
          variant="primary"
          text={'back'}
        />
        <Button
          onPress={() => {
            void deleteChat({chatInfo: chat, text: 'deleting you bro'})()
          }}
          variant="primary"
          text={'delete this shit'}
        />
      </ScrollView>
    </Screen>
  )
}

export default ChatDetailScreen
