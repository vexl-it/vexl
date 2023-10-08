import {atom} from 'jotai'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {type ChatNotificationData} from '../../../utils/notifications/ChatNotificationData'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {getOtherSideData} from './selectOtherSideDataAtom'
import reportError from '../../../utils/reportError'
import {decryptMessagePreview} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'

const decodeNotificationPreviewAction = atom(
  null,
  (
    get,
    set,
    notificationData: ChatNotificationData
  ): T.Task<{name: string; text: string} | null> => {
    if (!notificationData.preview) return T.of(null)
    const chat = get(
      focusChatByInboxKeyAndSenderKey({
        inboxKey: notificationData.inbox,
        senderKey: notificationData.sender,
      })
    )

    if (!chat) return T.of(null)

    return pipe(
      decryptMessagePreview(chat.chat.inbox.privateKey.privateKeyPemBase64)(
        notificationData.preview
      ),
      TE.match(
        () => {
          reportError(
            'warn',
            'error while decoding notification preview',
            notificationData
          )
          return null
        },
        (messageDecrypted) => {
          return {
            name: getOtherSideData(chat.chat).userName,
            text: messageDecrypted,
          }
        }
      )
    )
  }
)

export default decodeNotificationPreviewAction
