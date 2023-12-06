import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {atom} from 'jotai'
import {anonymizedUserDataAtom, sessionDataOrDummyAtom} from '../../session'
import {
  type ChatMessage,
  generateChatMessageId,
} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import * as TE from 'fp-ts/TaskEither'
import replaceImageFileUrisWithBase64, {
  type ReadingFileError,
} from '../utils/replaceImageFileUrisWithBase64'
import {pipe} from 'fp-ts/function'
import {privateApiAtom} from '../../../api'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import processIdentityRevealMessageIfAny from '../utils/processIdentityRevealMessageIfAny'
import removeFile from '../../../utils/removeFile'
import anonymizePhoneNumber from '../utils/anonymizePhoneNumber'
import {type UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {addMessageToMessagesArray} from '../utils/addMessageToChat'

export type IdentityRequestAlreadySentError =
  BasicError<'IdentityRequestAlreadySentError'>

export type RevealMessageType =
  | 'REQUEST_REVEAL'
  | 'APPROVE_REVEAL'
  | 'DISAPPROVE_REVEAL'

export default function revealIdentityActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [
    {
      type: RevealMessageType
      username: UserName | undefined
      imageUri?: UriString
    },
  ],
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
      {type, username, imageUri}
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

      const {phoneNumber} = get(sessionDataOrDummyAtom)
      const api = get(privateApiAtom)
      const anonymizedUserData = get(anonymizedUserDataAtom)

      const anonymizedPhoneNumber = anonymizePhoneNumber(phoneNumber)

      const messageWithFileUri: ChatMessage =
        type !== 'DISAPPROVE_REVEAL'
          ? {
              text: `Identity reveal ${type}`,
              image: imageUri,
              deanonymizedUser: {
                name: username ?? anonymizedUserData.userName,
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
        replaceImageFileUrisWithBase64(messageWithFileUri),
        TE.fromTask,
        TE.chainW((message) =>
          sendMessage({
            api: api.chat,
            senderKeypair: chat.inbox.privateKey,
            receiverPublicKey: chat.otherSide.publicKey,
            message,
          })
        ),

        TE.map((message): ChatMessageWithState => {
          if (
            ['APPROVE_REVEAL', 'DISAPPROVE_REVEAL'].includes(
              message.messageType
            )
          ) {
            const identityRevealMessage = get(
              chatWithMessagesAtom
            ).messages.find(
              (one) => one.message.messageType === 'REQUEST_REVEAL'
            )
            if (message.messageType === 'APPROVE_REVEAL')
              set(
                chatWithMessagesAtom,
                processIdentityRevealMessageIfAny(identityRevealMessage)
              )
            else if (
              message.messageType === 'DISAPPROVE_REVEAL' &&
              identityRevealMessage?.message.image
            ) {
              void removeFile(identityRevealMessage.message.image)()
            }
          }

          const successMessage: ChatMessageWithState = {
            message: messageWithFileUri,
            state: 'sent',
          }
          set(chatWithMessagesAtom, (old) => ({
            ...old,
            messages: addMessageToMessagesArray(old.messages)(successMessage),
          }))
          return successMessage
        })
      )
    }
  )
}
