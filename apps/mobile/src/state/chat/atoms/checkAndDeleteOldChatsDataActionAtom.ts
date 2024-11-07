import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {DateTime} from 'luxon'
import removeFile from '../../../utils/removeFile'
import messagingStateAtom from './messagingStateAtom'

const ONE_MONTH_IN_MS = 1000 * 60 * 60 * 24 * 30

export const checkAndDeleteOldChatsDataActionAtom = atom(
  null,
  (_, set, {key}: {key: PublicKeyPemBase64}) => {
    const inbox = focusAtom(messagingStateAtom, (optic) =>
      optic.find((one) => one.inbox.privateKey.publicKeyPemBase64 === key)
    )

    set(inbox, (prev) => ({
      ...prev,
      chats: prev.chats.filter((oneChat) => {
        const isChatDeletedAndExpired = oneChat.messages.some(
          (message) =>
            (message.message.messageType === 'DELETE_CHAT' ||
              message.message.messageType === 'INBOX_DELETED' ||
              message.message.messageType === 'CANCEL_REQUEST_MESSAGING' ||
              message.message.messageType === 'BLOCK_CHAT' ||
              message.message.messageType === 'DISAPPROVE_MESSAGING' ||
              message.message.messageType === 'OFFER_DELETED') &&
            message.message.time + ONE_MONTH_IN_MS < DateTime.now().toMillis()
        )

        if (
          isChatDeletedAndExpired &&
          oneChat.chat.otherSide.realLifeInfo?.image.type === 'imageUri'
        ) {
          void removeFile(oneChat.chat.otherSide.realLifeInfo.image.imageUri)()
        }

        return !isChatDeletedAndExpired
      }),
    }))
  }
)
