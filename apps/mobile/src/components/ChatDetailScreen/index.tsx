import {type RootStackScreenProps} from '../../navigationTypes'
import {ScopeProvider} from 'jotai-molecules'
import {ChatScope, dummyChatWithMessages} from './atoms'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import focusChatWithMessagesAtom from '../../state/chat/atoms/focusChatWithMessagesAtom'
import MessagesListOrApprovalPreview from './components/MessagesListOrApprovalPreview'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import AreYouSureDialog from '../AreYouSureDialog'

type Props = RootStackScreenProps<'ChatDetail'>

export default function ChatDetailScreen({
  navigation,
  route: {
    params: {chatId, inboxKey},
  },
}: Props): JSX.Element {
  const {nonNullChatWithMessagesAtom, chatExistsAtom} = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesAtom({chatId, inboxKey})

    const nonNullChatWithMessagesAtom = valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })
    const chatExistsAtom = hasNonNullableValueAtom(chatWithMessagesAtom)

    return {nonNullChatWithMessagesAtom, chatExistsAtom}
  }, [chatId, inboxKey])

  const chatExists = useAtomValue(chatExistsAtom)

  if (!chatExists) return <></>

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <MessagesListOrApprovalPreview />
      <AreYouSureDialog />
    </ScopeProvider>
  )
}
