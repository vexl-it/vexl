import {
  generateChatMessageId,
  type Chat,
  type ChatMessageId,
  type ReactionEmoji,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  compare,
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {setMyReaction} from '../utils/reactions'

const MINIMAL_VERSION_FOR_REACTIONS =
  Schema.decodeSync(VersionString)('26.11.0')

export function otherSideSupportsReactions(chat: Chat): boolean {
  if (!chat.otherSideVersion) return false
  return compare(chat.otherSideVersion)('>=', MINIMAL_VERSION_FOR_REACTIONS)
}

/**
 * Only messages both sides know under the same id can be reacted to -
 * local-only and not yet delivered messages can't.
 */
export function canReactToMessage(message: ChatMessageWithState): boolean {
  return (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'MESSAGE'
  )
}

interface ReactionSends {
  inFlight: number
  delivered: ReactionEmoji | undefined
  deliveredSendNumber?: number
}

type SendReactionAtom = ActionAtomType<
  [{targetMessageId: ChatMessageId; emoji: ReactionEmoji | undefined}],
  Effect.Effect<void, unknown>
>

export default function sendReactionActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): SendReactionAtom {
  const sendsByTarget = new Map<ChatMessageId, ReactionSends>()
  let sendCount = 0

  return atom(
    null,
    (get, set, {targetMessageId, emoji}): Effect.Effect<void, unknown> => {
      const {chat, reactions} = get(chatWithMessagesAtom)
      if (!otherSideSupportsReactions(chat)) return Effect.void

      const sends = sendsByTarget.get(targetMessageId) ?? {
        inFlight: 0,
        delivered: reactions[targetMessageId]?.mine,
      }
      sendsByTarget.set(targetMessageId, sends)
      sends.inFlight += 1
      const sendNumber = ++sendCount

      const setMine = (to: ReactionEmoji | undefined): void => {
        set(chatWithMessagesAtom, (old) => ({
          ...old,
          reactions: setMyReaction({
            reactions: old.reactions,
            targetMessageId,
            emoji: to,
          }),
        }))
      }

      return Effect.sync(() => {
        setMine(emoji)
      }).pipe(
        Effect.zipRight(
          sendMessage({
            api: get(apiAtom).chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message: {
              uuid: generateChatMessageId(),
              time: now(),
              myVersion: version,
              minimalRequiredVersion: MINIMAL_VERSION_FOR_REACTIONS,
              messageType: 'REACTION',
              senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
              text: '',
              reaction: {targetMessageId, emoji},
            },
            notificationApi: get(apiAtom).notification,
            theirNotificationToken: chat.otherSideVexlToken,
          })
        ),
        Effect.tap(() =>
          Effect.sync(() => {
            if ((sends.deliveredSendNumber ?? 0) > sendNumber) return
            sends.delivered = emoji
            sends.deliveredSendNumber = sendNumber
          })
        ),
        // Once the last send settles, show what the other side ended up with.
        Effect.ensuring(
          Effect.sync(() => {
            sends.inFlight -= 1
            if (sends.inFlight > 0) return
            sendsByTarget.delete(targetMessageId)
            if (
              get(chatWithMessagesAtom).reactions[targetMessageId]?.mine !==
              sends.delivered
            )
              setMine(sends.delivered)
          })
        ),
        Effect.asVoid
      )
    }
  )
}
