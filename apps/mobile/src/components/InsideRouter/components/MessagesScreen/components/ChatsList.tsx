import {type Atom, useAtomValue} from 'jotai'
import ChatListItem, {type ChatListData} from './ChatListItem'
import {selectAtom, splitAtom} from 'jotai/utils'
import {type ChatWithMessages} from '../../../../../state/chat/domain'
import messagingStateAtom from '../../../../../state/chat/atoms/messagingStateAtom'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {FlashList} from '@shopify/flash-list'
import notEmpty from '../../../../../utils/notEmpty'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {Text, YStack} from 'tamagui'

const chatIdsAtom = selectAtom(messagingStateAtom, (inboxes): ChatListData[] =>
  inboxes
    .reduce<ChatWithMessages[]>((acc, one) => {
      return acc.concat(one.chats)
    }, [])
    .map((one) => {
      if (one.messages.length === 0) return null

      const lastMessage = one.messages.at(-1)
      if (!lastMessage) return null

      const lastMessageIsMeDeletingChat =
        lastMessage.message.messageType === 'DELETE_CHAT' &&
        lastMessage.state === 'sent'
      const lastMessageIsMeBlockingChat =
        lastMessage.message.messageType === 'BLOCK_CHAT' &&
        lastMessage.state === 'sent'

      if (lastMessageIsMeDeletingChat || lastMessageIsMeBlockingChat)
        return null
      return {chat: one.chat, lastMessage}
    })
    .filter(notEmpty)
    .sort(
      (a, b) =>
        (b.lastMessage?.message.time ?? 0) - (a.lastMessage?.message.time ?? 0)
    )
)

const chatIdAtomsAtom = splitAtom(chatIdsAtom)

function renderItem({item}: {item: Atom<ChatListData>}): JSX.Element {
  return <ChatListItem dataAtom={item} />
}

function ChatsList(): JSX.Element | null {
  const {t} = useTranslation()
  const elementAtoms = useAtomValue(chatIdAtomsAtom)

  if (elementAtoms.length === 0) {
    return (
      <YStack space="$0" ai={'center'} py="$4" jc={'center'} f={1}>
        <Text color="$white" fos={20} ff={'$body600'}>
          {t('messages.chatEmpty')}
        </Text>
        <Text mb="$4" color={'$greyOnBlack'}>
          {t('messages.chatEmptyExplanation')}
        </Text>
      </YStack>
    )
  }

  return (
    <FlashList
      estimatedItemSize={72}
      data={elementAtoms}
      keyExtractor={atomKeyExtractor}
      renderItem={renderItem}
    />
  )
}

export default ChatsList
