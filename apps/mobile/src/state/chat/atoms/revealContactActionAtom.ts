import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {sessionDataOrDummyAtom} from '../../session'
import {anonymizedUserDataAtom} from '../../session/userDataAtoms'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import anonymizePhoneNumber from '../utils/anonymizePhoneNumber'
import processContactRevealMessageIfAny from '../utils/processContactRevealMessageIfAny'
import {type ReadingFileError} from '../utils/replaceImageFileUrisWithBase64'

export type ContactRevealRequestAlreadySentError =
  BasicError<'ContactRevealRequestAlreadySentError'>

export type RevealContactMessageType =
  | 'REQUEST_CONTACT_REVEAL'
  | 'APPROVE_CONTACT_REVEAL'
  | 'DISAPPROVE_CONTACT_REVEAL'

export default function revealContactActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{type: RevealContactMessageType}],
  TE.TaskEither<
    | SendMessageApiErrors
    | ErrorEncryptingMessage
    | ReadingFileError
    | JsonStringifyError
    | ZodParseError<ChatMessagePayload>
    | ContactRevealRequestAlreadySentError,
    ChatMessageWithState
  >
> {
  return atom(
    null,
    (
      get,
      set,
      {type}
    ): TE.TaskEither<
      | SendMessageApiErrors
      | ErrorEncryptingMessage
      | ReadingFileError
      | JsonStringifyError
      | ZodParseError<ChatMessagePayload>
      | ContactRevealRequestAlreadySentError,
      ChatMessageWithState
    > => {
      const {chat, messages} = get(chatWithMessagesAtom)

      if (
        type === 'REQUEST_CONTACT_REVEAL' &&
        messages.some(
          (one) => one.message.messageType === 'REQUEST_CONTACT_REVEAL'
        )
      ) {
        return TE.left({
          _tag: 'ContactRevealRequestAlreadySentError',
          error: new Error('Contact reveal already sent'),
        } as const)
      }

      const {realUserData, phoneNumber} = get(sessionDataOrDummyAtom)
      const anonymizedUserData = get(anonymizedUserDataAtom)
      const api = get(apiAtom)
      const identityRevealMessage = messages.find(
        (message) =>
          (message.message.messageType === 'APPROVE_REVEAL' ||
            message.message.messageType === 'REQUEST_REVEAL') &&
          message.message.senderPublicKey ===
            chat.inbox.privateKey.publicKeyPemBase64
      )

      const anonymizedPhoneNumber = anonymizePhoneNumber(phoneNumber)

      const message: ChatMessage = {
        text:
          type === 'DISAPPROVE_CONTACT_REVEAL'
            ? `Contact reveal denied`
            : `Contact reveal ${type}`,
        deanonymizedUser: {
          name:
            identityRevealMessage?.message.deanonymizedUser?.name ??
            realUserData?.userName ??
            anonymizedUserData.userName,
          fullPhoneNumber: phoneNumber,
          partialPhoneNumber: anonymizedPhoneNumber,
        },
        myVersion: version,
        time: unixMillisecondsNow(),
        uuid: generateChatMessageId(),
        messageType: type,
        senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
      }

      return pipe(
        effectToTaskEither(
          sendMessage({
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message,
            notificationApi: api.notification,
            theirFcmCypher: chat.otherSideFcmCypher,
            otherSideVersion: chat.otherSideVersion,
          })
        ),
        TE.map(() => {
          const successMessage: ChatMessageWithState = {
            message,
            state: 'sent',
          }

          if (successMessage.message.messageType === 'APPROVE_CONTACT_REVEAL') {
            const contactRevealMessage = get(
              chatWithMessagesAtom
            ).messages.find(
              (one) => one.message.messageType === 'REQUEST_CONTACT_REVEAL'
            )

            set(
              chatWithMessagesAtom,
              processContactRevealMessageIfAny(contactRevealMessage)
            )
          }

          set(chatWithMessagesAtom, addMessageToChat(successMessage))

          return successMessage
        })
      )
    }
  )
}
