import {ChatMessagePayloadE} from '@vexl-next/domain/src/general/messaging'
import {compare} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {chatMessagePayloadToChatMessage} from '@vexl-next/resources-utils/src/chat/utils/parseChatMessage'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {version} from './../../utils/environment'
import {registerInAppLoadingTask} from './../../utils/inAppLoadingTasks'
import messagingStateAtom, {
  lastDecodedSemverAtom,
  messagingStateAtomStorageAtom,
} from './atoms/messagingStateAtom'
import {type ChatMessageWithState, type InboxInState} from './domain'
import addMessagesToChats from './utils/addMessagesToChats'

export const decodePreviouslyUncompatibleMessagesInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'decodePreviouslyUncompatibleMessages',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'start',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        if (store.get(lastDecodedSemverAtom) === version) return

        const inboxes = pipe(
          store.get(messagingStateAtom),
          Array.map((oneInbox) =>
            pipe(
              oneInbox.chats.map((one) => one.messages).flat(),
              Array.filter(
                (
                  oneMessage
                ): oneMessage is typeof oneMessage & {
                  state: 'receivedButRequiresNewerVersion'
                } =>
                  oneMessage.state === 'receivedButRequiresNewerVersion' &&
                  compare(oneMessage.message.minimalRequiredVersion)(
                    '<=',
                    version
                  )
              ),
              Array.map((one) => one.message),
              Array.map((message) =>
                pipe(
                  message.messageParsed,
                  Schema.decodeUnknownOption(ChatMessagePayloadE),
                  Option.map(
                    chatMessagePayloadToChatMessage(message.senderPublicKey)
                  ),
                  Option.map(
                    (one) =>
                      ({
                        state: 'received',
                        message: {
                          ...one,
                          forceShow:
                            one.messageType === 'VERSION_UPDATE'
                              ? true
                              : undefined,
                        },
                      }) satisfies ChatMessageWithState
                  )
                )
              ),
              Array.filter(Option.isSome),
              Array.map((one) => one.value),
              addMessagesToChats(oneInbox.chats),
              (chats) =>
                ({
                  ...oneInbox,
                  chats,
                }) satisfies InboxInState
            )
          )
        )

        // Careful when parsing asynchronous code in jotai atoms.
        // Here it's safe as everything is synchronous.
        // Otherwise we can replace the state with an older one.
        store.set(messagingStateAtomStorageAtom, () => ({
          messagingState: inboxes,
          lastDecodedSemver: version,
        }))
      }),
  })
