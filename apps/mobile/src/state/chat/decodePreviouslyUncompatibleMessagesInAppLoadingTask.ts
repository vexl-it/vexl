import {ChatMessagePayload} from '@vexl-next/domain/src/general/messaging'
import {compare} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {chatMessagePayloadToChatMessage} from '@vexl-next/resources-utils/src/chat/utils/parseChatMessage'
import {safeParse} from '@vexl-next/resources-utils/src/utils/parsing'
import {Effect} from 'effect/index'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import {pipe} from 'fp-ts/lib/function'
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

        pipe(
          store.get(messagingStateAtom),
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
                  compare(oneMessage.message.minimalRequiredVersion)(
                    '<=',
                    version
                  )
              ),
              A.map((one) => one.message),
              A.map((message) =>
                pipe(
                  message.messageParsed,
                  safeParse(ChatMessagePayload),
                  O.fromEither,
                  O.map(
                    chatMessagePayloadToChatMessage(message.senderPublicKey)
                  ),
                  O.map(
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
            // Careful when parsing asynchronous code in jotai atoms.
            // Here it's safe as everything is synchronous.
            // Otherwise we can replace the state with an older one.
            store.set(messagingStateAtomStorageAtom, () => ({
              messagingState: inboxes,
              lastDecodedSemver: version,
            }))
          }
        )
      }),
  })
