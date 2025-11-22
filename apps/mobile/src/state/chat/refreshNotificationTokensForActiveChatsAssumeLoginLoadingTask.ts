import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {Array, Effect, flow, Option, pipe} from 'effect/index'
import {versionCode} from '../../utils/environment'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {getNotificationTokenE} from '../../utils/notifications'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {getOrFetchNotificationServerPublicKeyActionAtomE} from '../notifications/fcmServerPublicKeyStore'
import allChatsAtom from './atoms/allChatsAtom'
import {sendFcmCypherUpdateMessageActionAtom} from './atoms/refreshNotificationTokensActionAtom'
import {type ChatWithMessages} from './domain'

function doesOtherSideNeedsToBeNotifiedAboutTokenChange(
  notificationToken: ExpoNotificationToken | null,
  publicKeyFromServer: PublicKeyPemBase64
): (chat: ChatWithMessages) => boolean {
  return (chatWithMessages) => {
    if (!notificationToken) return !!chatWithMessages.chat.lastReportedFcmToken

    // Notify if we have notification token but we did not report it yet
    if (!chatWithMessages.chat.lastReportedFcmToken) return true

    const partsOfTheCypher = extractPartsOfNotificationCypher({
      notificationCypher: chatWithMessages.chat.lastReportedFcmToken.cypher,
    })

    return (
      // Cyher is not valid. Update it!
      Option.isNone(partsOfTheCypher) ||
      // we want to update token if expoV2 cypher is not used yet
      partsOfTheCypher.value.type !== 'expoV2' ||
      // The server public key has changed, update the token!
      partsOfTheCypher.value.data.serverPublicKey !== publicKeyFromServer ||
      // If the client version has changed, update the token!
      partsOfTheCypher.value.data.clientVersion !== versionCode ||
      // If the last reported token is not the same as the current token, update it!
      chatWithMessages.chat.lastReportedFcmToken?.token !== notificationToken
    )
  }
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

        const notificationToken = yield* _(getNotificationTokenE())
        const publicKeyFromServer = yield* _(
          store.set(getOrFetchNotificationServerPublicKeyActionAtomE)
        )

        if (Option.isNone(publicKeyFromServer)) {
          console.info(
            '🔥 Refresh notifications tokens',
            'No public key from server'
          )
          void showDebugNotificationIfEnabled({
            title: 'chat refreshing notTokens',
            subtitle: 'refreshNotificationTokensActionAtom',
            body: 'No public key from server',
          })
          return
        }

        const chatsToUpdate = pipe(
          store.get(allChatsAtom),
          Array.flatten,
          Array.filter(
            doesOtherSideNeedsToBeNotifiedAboutTokenChange(
              notificationToken,
              publicKeyFromServer.value
            )
          )
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
            flow(
              store.set(
                sendFcmCypherUpdateMessageActionAtom,
                notificationToken ?? undefined
              ),
              taskToEffect
            )
          ),
          Effect.allWith({concurrency: 'unbounded'})
        )
      }),
  })
