import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {DateTime} from 'luxon'
import removeFile from '../../../utils/removeFile'
import {cleanupOldTradeRemindersActionAtom} from '../../tradeReminders/atoms/cleanupOldTradeRemindersActionAtom'
import chatShouldBeVisible from '../utils/isChatActive'
import messagingStateAtom from './messagingStateAtom'

const ONE_MONTH_IN_MS = 1000 * 60 * 60 * 24 * 30

export const checkAndDeleteOldChatsAndDataActionAtom = atom(
  null,
  (get, set, {key}: {key: PublicKeyPemBase64}) => {
    const inbox = focusAtom(messagingStateAtom, (optic) =>
      optic.find((one) => one.inbox.privateKey.publicKeyPemBase64 === key)
    )

    set(inbox, (prev) => ({
      ...prev,
      chats: prev.chats.filter((oneChat) => {
        const lastMessage = oneChat.messages.at(-1)
        const isChatDeletedAndExpired =
          !lastMessage ||
          (!chatShouldBeVisible(oneChat) &&
            lastMessage.message.time + ONE_MONTH_IN_MS <
              DateTime.now().toMillis())

        if (
          isChatDeletedAndExpired &&
          oneChat.chat.otherSide.realLifeInfo?.image.type === 'imageUri'
        ) {
          void removeFile(oneChat.chat.otherSide.realLifeInfo.image.imageUri)()
        }

        return !isChatDeletedAndExpired
      }),
    }))

    // Cleanup old trade reminders for deleted or past trades
    void set(cleanupOldTradeRemindersActionAtom)
  }
)
