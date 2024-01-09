import {ChatMessagePayload} from '@vexl-next/domain/src/general/messaging'
import {chatMessagePayloadToChatMessage} from '@vexl-next/resources-utils/src/chat/utils/parseChatMessage'
import {safeParse} from '@vexl-next/resources-utils/src/utils/parsing'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import {pipe} from 'fp-ts/lib/function'
import {atom, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {version} from '../../../utils/environment'
import {type ChatMessageWithState, type InboxInState} from '../domain'
import addMessagesToChats from '../utils/addMessagesToChats'
import messagingStateAtom, {
  lastDecodedSemverAtom,
  messagingStateAtomStorageAtom,
} from './messagingStateAtom'
import {startMeasure} from '../../../utils/reportTime'
import {compare} from '@vexl-next/domain/src/utility/SmeverString.brand'

const decodePreviouslyUncompatibleMessagesActionAtom = atom(
  null,
  (get, set): void => {
    if (get(lastDecodedSemverAtom) === version) return

    console.info('🔍 Decoding previously incompatible messages')
    const timeMeasure = startMeasure(
      'Decoding previously incompatible messages'
    )

    pipe(
      get(messagingStateAtom),
      A.map((oneInbox) =>
        pipe(
          oneInbox.chats.map((one) => one.messages).flat(),
          A.filter(
            (
              oneMessage
            ): oneMessage is typeof oneMessage & {
              state: 'receivedButRequiresNewerVersion'
            } =>
              oneMessage.state === 'receivedButRequiresNewerVersion' &&
              compare(oneMessage.message.minimalRequiredVersion)('<=', version)
          ),
          A.map((one) => one.message),
          A.map((message) =>
            pipe(
              message.messageParsed,
              safeParse(ChatMessagePayload),
              O.fromEither,
              O.map(chatMessagePayloadToChatMessage(message.senderPublicKey)),
              O.map(
                (one) =>
                  ({
                    state: 'received',
                    message: one,
                  }) satisfies ChatMessageWithState
              )
            )
          ),
          A.filter(O.isSome),
          A.map((one) => one.value),
          addMessagesToChats(oneInbox.chats),
          (chats) =>
            ({
              ...oneInbox,
              chats,
            }) satisfies InboxInState
        )
      ),
      (inboxes) => {
        set(messagingStateAtomStorageAtom, (old) => ({
          messagingState: inboxes,
          lastDecodedSemver: version,
        }))
      }
    )

    timeMeasure()
  }
)

export default decodePreviouslyUncompatibleMessagesActionAtom

export function useDecodePreviouslyUncompatibleMessagesOnMount(): void {
  const decodePreviouslyUncompatibleMessages = useSetAtom(
    decodePreviouslyUncompatibleMessagesActionAtom
  )
  // We can use use effect here. We need to run it only on first app launch with new version.
  // Every time the app is updated, the app will be relaunched.
  useEffect(() => {
    decodePreviouslyUncompatibleMessages()
  }, [decodePreviouslyUncompatibleMessages])
}
