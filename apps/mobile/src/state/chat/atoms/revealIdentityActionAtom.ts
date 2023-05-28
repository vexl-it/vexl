import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {atom} from 'jotai'
import {sessionDataOrDummyAtom} from '../../session'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import * as TE from 'fp-ts/TaskEither'
import replaceImageFileUriWithBase64, {
  type ReadingFileError,
} from '../utils/replaceImageFileUriWithBase64'
import {pipe} from 'fp-ts/function'
import {privateApiAtom} from '../../../api'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'

function anonymizePhoneNumber(phoneNumber: E164PhoneNumber): string {
  const first3 = phoneNumber.slice(0, 4)
  const last3 = phoneNumber.slice(-3)
  const numberOfStars = phoneNumber.length - 7
  return `${first3} ${new Array(numberOfStars).fill('*').join('')} ${last3}`
}

export type IdentityRequestAlreadySentError =
  BasicError<'IdentityRequestAlreadySentError'>

export type RevealMessageType =
  | 'REQUEST_REVEAL'
  | 'APPROVE_REVEAL'
  | 'DISAPPROVE_REVEAL'
export default function revealIdentityActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{type: RevealMessageType}],
  TE.TaskEither<
    | SendMessageApiErrors
    | ErrorEncryptingMessage
    | ReadingFileError
    | IdentityRequestAlreadySentError,
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
      | IdentityRequestAlreadySentError,
      ChatMessageWithState
    > => {
      const {chat, messages} = get(chatWithMessagesAtom)

      if (
        type === 'REQUEST_REVEAL' &&
        messages.some((one) => one.message.messageType === 'REQUEST_REVEAL')
      ) {
        return TE.left({
          _tag: 'IdentityRequestAlreadySentError',
          error: new Error('Reveal already sent'),
        } as const)
      }

      const {
        realUserData: {userName, image},
        phoneNumber,
      } = get(sessionDataOrDummyAtom)
      const api = get(privateApiAtom)

      const anonymizedPhoneNumber = anonymizePhoneNumber(phoneNumber)

      const messageWithFileUri: ChatMessage =
        type !== 'DISAPPROVE_REVEAL'
          ? {
              text: `Identity reveal ${type}`,
              image: image.imageUri,
              deanonymizedUser: {
                name: userName,
                partialPhoneNumber: anonymizedPhoneNumber,
              },
              time: unixMillisecondsNow(),
              uuid: generateChatMessageId(),
              messageType: type,
              senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
            }
          : {
              text: 'Identity reveal denied',
              time: unixMillisecondsNow(),
              uuid: generateChatMessageId(),
              messageType: type,
              senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
            }

      return pipe(
        replaceImageFileUriWithBase64(messageWithFileUri),
        TE.chainW((message) =>
          sendMessage({
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message,
          })
        ),
        TE.map((): ChatMessageWithState => {
          const successMessage: ChatMessageWithState = {
            message: messageWithFileUri,
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
