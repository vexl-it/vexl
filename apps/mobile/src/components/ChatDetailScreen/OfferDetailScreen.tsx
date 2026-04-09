import {ScopeProvider} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../state/chat/domain'
import hasNonNullableValueAtom from '../../utils/atomUtils/hasNonNullableValueAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {ChatScope} from './atoms'
import ChatOfferDetailContent from './components/ChatOfferDetailContent'

type Props = RootStackScreenProps<'ChatOfferDetail'>

export default function OfferDetailScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): React.ReactElement {
  const {nonNullChatWithMessagesAtom, chatExistsAtom} = useMemo(() => {
    const chatWithMessagesAtom = focusChatWithMessagesByKeysAtom({
      otherSideKey,
      inboxKey,
    })

    const nonNullChatWithMessagesAtom = valueOrDefaultAtom({
      nullableAtom: chatWithMessagesAtom,
      dummyValue: dummyChatWithMessages,
    })

    const chatExistsAtom = hasNonNullableValueAtom(chatWithMessagesAtom)

    return {nonNullChatWithMessagesAtom, chatExistsAtom}
  }, [inboxKey, otherSideKey])

  const chatExists = useAtomValue(chatExistsAtom)

  return (
    <ScopeProvider scope={ChatScope} value={nonNullChatWithMessagesAtom}>
      <ChatOfferDetailContent chatExists={chatExists} />
    </ScopeProvider>
  )
}
