import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {
  effectToTask,
  effectToTaskEither,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Option, Schema} from 'effect/index'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import reportError from '../../../utils/reportError'
import {generateAndRegisterVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {type ChatWithMessages} from '../domain'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {updateMyNotificationTokenInfoInChat} from './updateMyNotificationTokenInfoInChat'

const FCM_TOKEN_UPDATE_MESSAGE_MINIMAL_VERSION =
  Schema.decodeSync(VersionString)('1.13.1')

function createFcmCypherUpdateMessage(
  senderPublicKey: PublicKeyPemBase64,
  vexlToken?: VexlNotificationToken
): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    myVexlToken: vexlToken,
    time: now(),
    myVersion: version,
    messageType: 'FCM_CYPHER_UPDATE',
    minimalRequiredVersion: FCM_TOKEN_UPDATE_MESSAGE_MINIMAL_VERSION,
    senderPublicKey,
    text: '',
  }
}

export const sendFcmCypherUpdateMessageActionAtom = atom(
  null,
  (get, set): ((chatWithMessages: ChatWithMessages) => T.Task<boolean>) => {
    return (chatWithMessages) => {
      return pipe(
        T.Do,
        T.map((o) => {
          console.info(
            `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`
          )
          return o
        }),
        T.bind('vexlNotificationToken', () =>
          effectToTask(
            set(generateAndRegisterVexlTokenActionAtom, {
              keyHolder: chatWithMessages.chat.inbox.privateKey,
            }).pipe(Effect.option)
          )
        ),
        T.bind('messageToSend', ({vexlNotificationToken}) =>
          T.of(
            createFcmCypherUpdateMessage(
              chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
              Option.getOrUndefined(vexlNotificationToken)
            )
          )
        ),
        TE.fromTask,
        TE.bind('sentMessage', ({messageToSend}) =>
          effectToTaskEither(
            sendMessage({
              api: get(apiAtom).chat,
              senderKeypair: chatWithMessages.chat.inbox.privateKey,
              receiverPublicKey: chatWithMessages.chat.otherSide.publicKey,
              message: messageToSend,
              notificationApi: get(apiAtom).notification,
              theirNotificationToken: chatWithMessages.chat.otherSideVexlToken,
            })
          )
        ),
        TE.map(({vexlNotificationToken}) => {
          const chatAtom = focusChatByInboxKeyAndSenderKey({
            inboxKey: chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
            senderKey: chatWithMessages.chat.otherSide.publicKey,
          })
          set(
            chatAtom,
            updateMyNotificationTokenInfoInChat(
              Option.getOrUndefined(vexlNotificationToken)
            )
          )
        }),
        TE.matchW(
          (e) => {
            reportError(
              'error',
              new Error('Error while refreshing fcm cypher'),
              {e}
            )
            console.warn(
              `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`,
              `Error refreshing ${e._tag}`
            )
            return false
          },
          () => {
            console.info(
              `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`,
              'success'
            )
            return true
          }
        )
      )
    }
  }
)
