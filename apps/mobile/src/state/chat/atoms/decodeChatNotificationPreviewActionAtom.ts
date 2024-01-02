import {messagePreviewFromNetwork} from '@vexl-next/resources-utils/dist/chat/utils/messagePreviewIO'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {type ChatNotificationData} from '../../../utils/notifications/ChatNotificationData'
import reportError from '../../../utils/reportError'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {getOtherSideData} from './selectOtherSideDataAtom'

const decodeNotificationPreviewAction = atom(
  null,
  (
    get,
    set,
    notificationData: ChatNotificationData
  ): T.Task<{name: string; text?: string} | null> => {
    if (!notificationData.inbox || !notificationData.sender) return T.of(null)
    const chat = get(
      focusChatByInboxKeyAndSenderKey({
        inboxKey: notificationData.inbox,
        senderKey: notificationData.sender,
      })
    )

    if (!chat) return T.of(null)
    if (!notificationData.preview)
      return T.of({name: getOtherSideData(chat.chat).userName})

    return pipe(
      messagePreviewFromNetwork(chat.chat.inbox.privateKey.privateKeyPemBase64)(
        notificationData.preview
      ),
      TE.match(
        () => {
          reportError(
            'warn',
            'error while decoding notification preview',
            notificationData
          )
          return {
            name: getOtherSideData(chat.chat).userName,
          }
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
