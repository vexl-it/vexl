import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
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
import removeFile from '../../../utils/removeFile'
import {anonymizedUserDataAtom, sessionDataOrDummyAtom} from '../../session'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import anonymizePhoneNumber from '../utils/anonymizePhoneNumber'
import processIdentityRevealMessageIfAny from '../utils/processIdentityRevealMessageIfAny'
import replaceImageFileUrisWithBase64, {
  type ReadingFileError,
} from '../utils/replaceImageFileUrisWithBase64'

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
    | JsonStringifyError
    | ZodParseError<ChatMessagePayload>
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
      | JsonStringifyError
      | ZodParseError<ChatMessagePayload>
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
      const api = get(apiAtom)
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
              myVersion: version,
              messageType: type,
              senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
            }
          : {
              text: 'Identity reveal denied',
              time: unixMillisecondsNow(),
              myVersion: version,
              uuid: generateChatMessageId(),
              messageType: type,
              senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
            }

      return pipe(
        replaceImageFileUrisWithBase64(messageWithFileUri),
        TE.fromTask,
        TE.chainFirstW((message) =>
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
          set(chatWithMessagesAtom, addMessageToChat(successMessage))
          return successMessage
        })
      )
    }
  )
}
