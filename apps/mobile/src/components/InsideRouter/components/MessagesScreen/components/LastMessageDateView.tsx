import {useAtomValue, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
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
              ? unixMillisecondsToLocaleDateTime(l.message.time)
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
