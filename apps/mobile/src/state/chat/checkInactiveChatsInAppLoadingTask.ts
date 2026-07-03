import {Array, Effect, pipe} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import allChatsAtom from './atoms/allChatsAtom'
import focusChatByInboxKeyAndSenderKey from './atoms/focusChatByInboxKeyAndSenderKey'
import {insertInactivityReminderActionAtom} from './atoms/insertInactivityReminderActionAtom'
import chatShouldBeVisible from './utils/isChatActive'

export const checkInactiveChatsInAppLoadingTaskId = registerInAppLoadingTask({
  name: 'checkInactiveChats',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'start',
  },
  task: (store) =>
    Effect.sync(() => {
      const visibleChats = pipe(
        store.get(allChatsAtom).flat(),
        Array.filter(chatShouldBeVisible)
      )

      const insertedCount = pipe(
        visibleChats,
        Array.map((chat) =>
          store.set(
            insertInactivityReminderActionAtom,
            focusChatByInboxKeyAndSenderKey({
              inboxKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
              senderKey: chat.chat.otherSide.publicKey,
            })
          )
        ),
        Array.filter((inserted) => inserted)
      ).length

      if (insertedCount > 0) {
        console.log(`Inserted inactivity reminder into ${insertedCount} chats`)
      }
    }),
})
