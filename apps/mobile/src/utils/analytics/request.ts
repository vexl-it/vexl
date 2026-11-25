import {bucketDuration} from '@vexl-next/analytics-definitions/src/buckets'
import {
  sentRequestClass,
  type FriendLevel,
} from '@vexl-next/analytics-definitions/src/coreAction'
import {
  requestJourney,
  type RequestOutcome,
  type RequestState,
} from '@vexl-next/analytics-definitions/src/definitions/request'
import {type ChatId} from '@vexl-next/domain/src/general/messaging'
import {Array, Option, pipe} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../state/chat/domain'
import {reportAfterOpenActionAtom} from './afterOpenAction'
import {analyticsActionAtom} from './analyticsActionAtom'
import {bothWrote, earliest, messageTimes} from './chatMessages'
import {reportCoreActionActionAtom} from './coreAction'
import {journeyReportActionAtom} from './report'

const requestJourneyAtom = journeyReportActionAtom(requestJourney)

/** The first outcome sticks, so a later re-request does not rewrite it. */
const outcomeOnce =
  (outcome: Partial<RequestState>) =>
  (current: Option.Option<RequestState>): Partial<RequestState> =>
    Option.exists(current, (state) => state.outcome !== undefined)
      ? {}
      : outcome

/** Re-requests on an existing chat and note requests must not be reported. */
export const reportRequestSentActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {chatId, friendLevel}: {chatId: ChatId; friendLevel: readonly FriendLevel[]}
  ) => {
    const actionClass = sentRequestClass(friendLevel)
    set(
      requestJourneyAtom,
      {class: actionClass},
      {key: chatId, alwaysStart: true}
    )
    set(reportCoreActionActionAtom, {kind: 'request', actionClass})
    set(reportAfterOpenActionAtom, 'requestSent')
  }
)

export const reportRequestCancelledActionAtom = analyticsActionAtom(
  (get, set, chatId: ChatId) => {
    set(requestJourneyAtom, outcomeOnce({outcome: 'cancelled'}), {
      key: chatId,
      onlyIfOpen: true,
    })
  }
)

const answerOutcome = (
  message: ChatMessageWithState
): Option.Option<{outcome: RequestOutcome; at: number}> => {
  if (message.state !== 'received') return Option.none()
  if (message.message.messageType === 'APPROVE_MESSAGING')
    return Option.some({outcome: 'approved', at: message.message.time})
  if (message.message.messageType === 'DISAPPROVE_MESSAGING')
    return Option.some({outcome: 'rejected', at: message.message.time})
  return Option.none()
}

/** New messages in a chat on someone else's offer, or my message sent there. */
export const reportRequestChatUpdatedActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {
      chat,
      newMessages,
    }: {chat: ChatWithMessages; newMessages: readonly ChatMessageWithState[]}
  ) => {
    const requestSentAt = earliest(
      messageTimes(chat.messages, 'sent', 'REQUEST_MESSAGING')
    )
    const answer = pipe(
      Array.findFirst(newMessages, answerOutcome),
      Option.map(
        ({outcome, at}): Partial<RequestState> => ({
          outcome,
          ...Option.match(requestSentAt, {
            onNone: () => ({}),
            onSome: (sentAt) => ({answerAfter: bucketDuration(at - sentAt)}),
          }),
        })
      )
    )

    set(
      requestJourneyAtom,
      (current) => ({
        ...Option.match(answer, {
          onNone: () => ({}),
          onSome: (one) => outcomeOnce(one)(current),
        }),
        ...(bothWrote(chat) ? {bothWrote: true} : {}),
      }),
      {key: chat.chat.id, onlyIfOpen: true}
    )
  }
)
