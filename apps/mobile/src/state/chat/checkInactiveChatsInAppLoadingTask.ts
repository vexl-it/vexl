import {Array, Effect, pipe} from 'effect'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import allChatsAtom from './atoms/allChatsAtom'
import focusChatByInboxKeyAndSenderKey from './atoms/focusChatByInboxKeyAndSenderKey'
import {insertInactivityReminderActionAtom} from './atoms/insertInactivityReminderActionAtom'
import {fetchMessagesForAllInboxesInAppLoadingTaskId} from './fetchMessagesForAllInboxesInAppLoadingTask'
import chatShouldBeVisible from './utils/isChatActive'

export const checkInactiveChatsInAppLoadingTaskId = registerInAppLoadingTask({
  name: 'checkInactiveChats',
  requirements: {
    requiresUserLoggedIn: true,
    // Runs on `resume` (which also fires on cold start) so it can depend on the
    // message fetch below. Otherwise it would scan stale local chat state and
    // insert a now-timed reminder that masks an older, newly fetched real
    // message once the fetch completes.
    runOn: 'resume',
  },
  // Must run after messages are fetched so the inactivity check sees the fresh
  // last message instead of stale local state.
  dependsOn: [{id: fetchMessagesForAllInboxesInAppLoadingTaskId}],
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
