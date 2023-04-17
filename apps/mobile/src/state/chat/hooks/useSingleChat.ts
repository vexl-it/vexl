import {type ChatId} from '@vexl-next/domain/dist/general/messaging'
import {chatAtom} from '../atom'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {type ChatWithMessages} from '../domain'

export default function useSingleChat(
  chatId: ChatId
): ChatWithMessages | undefined {
  return useAtomValue(useMemo(() => chatAtom(chatId), [chatId]))?.[0]
}
