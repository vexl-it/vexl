import {Array, Effect, pipe} from 'effect'
import {version} from '../../utils/environment'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import allChatsAtom from './atoms/allChatsAtom'
import {sendUpdateNoticeMessageActionAtom} from './atoms/checkAndReportCurrentVersionToChatsActionAtom'
import focusChatByInboxKeyAndSenderKey from './atoms/focusChatByInboxKeyAndSenderKey'
import isChatOpen from './utils/isChatOpen'

export const checkAndReportCurrentVersionToChatsInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'checkAndReportCurrentVersionToChats',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'start',
    },
    task: (store) =>
      Effect.gen(function* () {
        const chatsToSendUpdateInto = store
          .get(allChatsAtom)
          .flat()
          .filter(isChatOpen)
          .filter((oneChat) => oneChat.chat.lastReportedVersion !== version)

        if (chatsToSendUpdateInto.length === 0) {
          console.log('There are no chats to send version update into')
          return
        }

        console.log(
          `Sending version update into ${chatsToSendUpdateInto.length} chats`
        )

        yield* pipe(
          chatsToSendUpdateInto,
          Array.map((chat) =>
            store.set(
              sendUpdateNoticeMessageActionAtom,
              focusChatByInboxKeyAndSenderKey({
                inboxKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
                senderKey: chat.chat.otherSide.publicKey,
              })
            )
          ),
          (effects) => Effect.all(effects, {concurrency: 'unbounded'})
        )
      }),
  })
