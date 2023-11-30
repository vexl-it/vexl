import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import * as TE from 'fp-ts/TaskEither'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {type ReadingFileError} from '../utils/replaceImageFileUrisWithBase64'
import {atom} from 'jotai'
import {anonymizedUserDataAtom, sessionDataOrDummyAtom} from '../../session'
import {privateApiAtom} from '../../../api'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {pipe} from 'fp-ts/function'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import anonymizePhoneNumber from '../utils/anonymizePhoneNumber'

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
      const api = get(privateApiAtom)
      const identityRevealMessage = messages.find(
        (message) =>
          (message.message.messageType === 'APPROVE_REVEAL' ||
            message.message.messageType === 'REQUEST_REVEAL') &&
          message.message.senderPublicKey ===
            chat.inbox.privateKey.publicKeyPemBase64
      )

      const anonymizedPhoneNumber = anonymizePhoneNumber(phoneNumber)

      const chatMessage: ChatMessage = {
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
        time: unixMillisecondsNow(),
        uuid: generateChatMessageId(),
        messageType: type,
        senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
      }

      return pipe(
        sendMessage({
          api: api.chat,
          senderKeypair: chat.inbox.privateKey,
          receiverPublicKey: chat.otherSide.publicKey,
          message: chatMessage,
        }),
        TE.map(() => {
          const successMessage: ChatMessageWithState = {
            message: chatMessage,
            state: 'sent',
          }
          set(chatWithMessagesAtom, (old) => ({
            ...old,
            messages: [...old.messages, successMessage],
          }))
          return successMessage
        })
      )
    }
  )
}
