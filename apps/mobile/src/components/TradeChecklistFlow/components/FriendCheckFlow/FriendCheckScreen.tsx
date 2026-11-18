import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {friendCheckSubjectAtom} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import AskCommonFriend from './AskCommonFriend'
import RevealIdentityFirst from './RevealIdentityFirst'

type Props = TradeChecklistStackScreenProps<'FriendCheck'>

export default function FriendCheckScreen({
  navigation,
}: Props): React.ReactElement {
  return Option.match(useAtomValue(friendCheckSubjectAtom), {
    onNone: () => <RevealIdentityFirst navigation={navigation} />,
    onSome: (subject) => <AskCommonFriend subject={subject} />,
  })
}
