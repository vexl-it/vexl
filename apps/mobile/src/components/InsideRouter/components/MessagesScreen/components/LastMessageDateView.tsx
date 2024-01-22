import {useAtomValue, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import FromNowComponent from '../../../../FromNowComponent'

function LastMessageDateView({
  lastMessageAtom,
}: {
  lastMessageAtom: Atom<ChatMessageWithState | undefined>
}): JSX.Element | null {
  const date = useAtomValue(
    useMemo(
      () =>
        selectAtom(
          lastMessageAtom,
          (l) =>
            l
              ? DateTime.fromMillis(l.message.time)
              : DateTime.invalid('No last message'),
          (a, b) => a.equals(b)
        ),
      [lastMessageAtom]
    )
  )

  if (!date.isValid) return null

  return <FromNowComponent date={date} />
}

export default LastMessageDateView
