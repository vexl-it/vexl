import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, flow, pipe} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import allChatsAtom from './atoms/allChatsAtom'
import {sendFcmCypherUpdateMessageActionAtom} from './atoms/refreshNotificationTokensActionAtom'
import {type ChatWithMessages} from './domain'

function doesOtherSideNeedsToBeNotifiedAboutTokenChange(
  chat: ChatWithMessages
): boolean {
  return !chat.chat.lastReportedVexlToken
}
export const refreshNotificationTokensForActiveChatsAssumeLoginLoadingTaskId =
  registerInAppLoadingTask({
    name: 'refreshNotificationTokensForActiveChatsAssumeLogin',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        console.info(
          '🔥 Refresh notifications tokens',
          'Checking if notification cyphers needs to be updated'
        )

        void showDebugNotificationIfEnabled({
          title: 'refreshing notification tokens',
          subtitle: 'refreshNotificationTokensActionAtom',
          body: 'Checking if notification cyphers needs to be updated',
        })

        const chatsToUpdate = pipe(
          store.get(allChatsAtom),
          Array.flatten,
          Array.filter(doesOtherSideNeedsToBeNotifiedAboutTokenChange)
        )

        if (!Array.isNonEmptyArray(chatsToUpdate)) {
          console.info(
            '🔥 Refresh notifications tokens',
            'No chats need to update notification tokens'
          )
          void showDebugNotificationIfEnabled({
            title: 'chat refreshing notTokens',
            subtitle: 'refreshNotificationTokensActionAtom',
            body: 'No chats need to update notification tokens',
          })
          return
        }

        yield* _(
          Array.map(
            chatsToUpdate,
            flow(store.set(sendFcmCypherUpdateMessageActionAtom), taskToEffect)
          ),
          Effect.allWith({concurrency: 'unbounded'})
        )
      }),
  })
