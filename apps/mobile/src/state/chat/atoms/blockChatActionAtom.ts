import {type HttpApiDecodeError} from '@effect/platform/HttpApiError'
import {
  type RequestError,
  type ResponseError,
} from '@effect/platform/HttpClientError'
import {
  type NotFoundError,
  type RateLimitedError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import {
  type ErrorSigningChallenge,
  type InvalidChallengeError,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {
  type ReceiverInboxDoesNotExistError,
  type SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {type ForbiddenMessageTypeError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type ErrorGeneratingChallenge} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {type ParseResult} from 'effect/index'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {createSingleOfferReportedFlagAtom} from '../../marketplace/atoms/offersState'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function blockChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    | ErrorEncryptingMessage
    | HttpApiDecodeError
    | InvalidChallengeError
    | ForbiddenMessageTypeError
    | NotFoundError
    | UnexpectedServerError
    | ParseResult.ParseError
    | ErrorGeneratingChallenge
    | SenderInboxDoesNotExistError
    | ReceiverInboxDoesNotExistError
    | ErrorSigningChallenge
    | RateLimitedError
    | CryptoError
    | RequestError
    | ResponseError
    | ZodParseError<ChatMessagePayload>
    | JsonStringifyError,
    ChatMessageWithState
  >
> {
  return atom(null, (get, set, {text}) => {
    const {chat} = get(chatWithMessagesAtom)
    const api = get(apiAtom)

    const messageToSend: ChatMessage = {
      text,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      myVersion: version,
      messageType: 'BLOCK_CHAT',
      senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    }

    return pipe(
      effectToTaskEither(
        sendMessage({
          api: api.chat,
          senderKeypair: chat.inbox.privateKey,
          receiverPublicKey: chat.otherSide.publicKey,
          message: messageToSend,
          notificationApi: api.notification,
          theirNotificationCypher: chat.otherSideFcmCypher,
          otherSideVersion: chat.otherSideVersion,
        })
      ),
      TE.matchW(
        (e) => {
          if (
            e._tag === 'SenderInboxDoesNotExistError' ||
            e._tag === 'ReceiverInboxDoesNotExistError' ||
            e._tag === 'NotPermittedToSendMessageToTargetInboxError'
          ) {
            return E.right(null)
          }

          return E.left(e)
        },
        () => E.right(null)
      ),
      TE.chainW(() =>
        effectToTaskEither(
          api.chat.blockInbox({
            keyPair: chat.inbox.privateKey,
            publicKeyToBlock: chat.otherSide.publicKey,
          })
        )
      ),
      TE.map((): ChatMessageWithState => {
        const successMessage = {
          message: messageToSend,
          state: 'sent',
        } as const

        set(chatWithMessagesAtom, (old) => ({
          ...old,
          chat: {
            ...old.chat,
            lastReportedVersion:
              messageToSend.myVersion ?? old.chat.lastReportedVersion,
          },
          messages: [successMessage],
        }))

        if (chat.origin.type === 'theirOffer') {
          set(createSingleOfferReportedFlagAtom(chat.origin.offerId), true)
        }

        return successMessage
      })
    )
  })
}
