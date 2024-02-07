import {FlashList} from '@shopify/flash-list'
import {useAtomValue, type Atom} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import {Text, YStack} from 'tamagui'
import messagingStateAtom from '../../../../../state/chat/atoms/messagingStateAtom'
import {type ChatWithMessages} from '../../../../../state/chat/domain'
import isChatActive from '../../../../../state/chat/utils/isChatActive'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import notEmpty from '../../../../../utils/notEmpty'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import ChatListItem, {type ChatListData} from './ChatListItem'

const chatIdsAtom = selectAtom(messagingStateAtom, (inboxes): ChatListData[] =>
  inboxes
    .reduce<ChatWithMessages[]>((acc, one) => {
      return acc.concat(one.chats)
    }, [])
    .filter(isChatActive)
    .map((one) => {
      if (one.messages.length === 0) return null

      const lastMessage = one.messages.at(-1)
      if (!lastMessage) return null

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
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  if (elementAtoms.length === 0) {
    return (
      <YStack space="$0" ai="center" py="$4" jc="center" f={1}>
        <Text color="$white" fos={20} ff="$body600">
          {t('messages.chatEmpty')}
        </Text>
        <Text mb="$4" color="$greyOnBlack">
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
      contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
    />
  )
}

export default ChatsList
