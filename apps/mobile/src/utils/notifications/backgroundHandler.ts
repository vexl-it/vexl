import notifee from '@notifee/react-native'
import {
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewSocialNetworkConnectionNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, Option, Record, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {AppState, Platform} from 'react-native'
import {apiAtom} from '../../api'
import {addNotificationToCenterActionAtom} from '../../components/NotificationsScreen/state'
import {checkForClubsAdmissionActionAtom} from '../../state/clubs/atom/checkForClubsAdmissionActionAtom'
import {clubsToKeyHolderAtom} from '../../state/clubs/atom/clubsToKeyHolderV2Atom'
import {
  syncAllClubsHandleStateWhenNotFoundActionAtom,
  syncSingleClubHandleStateWhenNotFoundActionAtom,
} from '../../state/clubs/atom/refreshClubsActionAtom'
import {
  addReasonToRemovedClubActionAtom,
  createSingleRemovedClubAtom,
  markRemovedClubAsNotifiedActionAtom,
} from '../../state/clubs/atom/removedClubsAtom'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {
  reportProcessingNotificationEndActionAtom,
  reportProcessingNotificationsStartActionAtom,
} from '../../state/notifications/NotificationProcessingReports'
import processChatNotificationActionAtom from '../../state/notifications/processChatNotification'
import {reportNewConnectionNotificationForked} from '../../state/notifications/reportNewConnectionNotification'
import {translationAtom} from '../localization/I18nProvider'
import reportError from '../reportError'
import {BACKGROUND_NOTIFICATION_TASK} from './defineBackgroundNotificationTask'
import {extractDataPayloadFromNotification} from './extractDataFromNotification'
import {getDefaultChannel} from './notificationChannels'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'

export async function processBackgroundMessage(
  data: Notifications.NotificationTaskPayload
): Promise<void> {
  const processUuid = generateUuid()

  try {
    const notificationPayloadO = extractDataPayloadFromNotification({
      source: 'background',
      data,
    })

    if (Option.isNone(notificationPayloadO)) {
      console.info(
        `📳 ‼️ Background notification and unable to parse ${JSON.stringify(
          data,
          null,
          2
        )}`
      )

      void showDebugNotificationIfEnabled({
        title: `Error decoding background notification `,
        subtitle: 'notifInBackgroundHandler',
        body: `${JSON.stringify(data, null, 2)}`,
      })
      return
    }

    const {payload, isHeadless} = notificationPayloadO.value

    if (Platform.OS === 'android' && AppState.currentState === 'active') {
      console.info(
        '📳 Received notification in backfground handler. App is active and we are on android. Leaving processing up to a hook'
      )
      void showDebugNotificationIfEnabled({
        title: `Received notification not processing in background`,
        subtitle: 'notifInBackgroundHandler',
        body: `App is active. Handling in hook`,
      })
      return
    }
    getDefaultStore().set(
      reportProcessingNotificationsStartActionAtom,
      processUuid,
      'handler',
      data
    )

    void showDebugNotificationIfEnabled({
      title: `Background notification received `,
      subtitle: 'notifInBackgroundHandler',
      body: `${JSON.stringify(payload, null, 2)}`,
    })

    console.info(
      `📳 Background notification received. Is headless: ${isHeadless}`,
      AppState.currentState,
      JSON.stringify(payload, null, 2)
    )

    const newChatMessageNoticeNotificationDataOption =
      NewChatMessageNoticeNotificationData.parseUnkownOption(payload)
    if (Option.isSome(newChatMessageNoticeNotificationDataOption)) {
      await getDefaultStore()
        .set(
          processChatNotificationActionAtom,
          newChatMessageNoticeNotificationDataOption.value
        )
        .pipe(Effect.runPromise)
      return
    }

    if (!payload) {
      console.info(
        '📳 Nothing to process. Notification does not include any data'
      )
      return
    }

    const newSocialNetworkConnectionNotificationO = Schema.decodeUnknownOption(
      NewSocialNetworkConnectionNotificationData
    )(payload)

    if (Option.isSome(newSocialNetworkConnectionNotificationO)) {
      console.info(
        '📳 Received notification about new user. Checking and updating offers accordingly.'
      )
      await Effect.runPromise(
        reportNewConnectionNotificationForked(
          getDefaultStore().get(apiAtom).metrics,
          newSocialNetworkConnectionNotificationO.value.trackingId
        )
      )
      await Effect.runPromise(getDefaultStore().set(syncConnectionsActionAtom))
      await Effect.runPromise(
        getDefaultStore().set(
          updateAndReencryptAllOffersConnectionsActionAtom,
          {
            isInBackground: true,
          }
        )
      )
      return
    }

    const newClubConnectionNotificationO = Schema.decodeUnknownOption(
      NewClubConnectionNotificationData
    )(payload)
    if (Option.isSome(newClubConnectionNotificationO)) {
      console.info(
        `📳 Received notification about new user in club ${newClubConnectionNotificationO.value.clubUuids.join(',')}. Checking and updating offers accordingly.`
      )
      await Effect.runPromise(
        getDefaultStore().set(syncAllClubsHandleStateWhenNotFoundActionAtom, {
          updateOnlyUuids: newClubConnectionNotificationO.value.clubUuids,
        })
      )
      await Effect.runPromise(
        getDefaultStore().set(
          updateAndReencryptAllOffersConnectionsActionAtom,
          {
            isInBackground: true,
          }
        )
      )
      return
    }

    const admitedToClubNetworkNotificationDataO = Schema.decodeUnknownOption(
      AdmitedToClubNetworkNotificationData
    )(payload)
    if (Option.isSome(admitedToClubNetworkNotificationDataO)) {
      console.info(
        `📳 Received notification about beeing added to club ${admitedToClubNetworkNotificationDataO.value.publicKey}`
      )
      await Effect.runPromise(
        getDefaultStore().set(checkForClubsAdmissionActionAtom)
      )

      return
    }

    const ClubDeactivatedNotificationDataO = Schema.decodeUnknownOption(
      ClubDeactivatedNotificationData
    )(payload)
    if (Option.isSome(ClubDeactivatedNotificationDataO)) {
      const store = getDefaultStore()
      const {t} = store.get(translationAtom)
      const publicKeyO = Record.get(
        store.get(clubsToKeyHolderAtom),
        ClubDeactivatedNotificationDataO.value.clubUuid
      ).pipe(Option.map((k) => k.keyPair.publicKey))

      await Effect.runPromise(
        store
          .set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
            clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
          })
          .pipe(
            Effect.catchAll((e) => {
              if (
                e._tag === 'ClubNotFoundError' ||
                e._tag === 'FetchingClubError' ||
                e._tag === 'NoSuchElementException'
              )
                return Effect.succeed(Effect.void)

              return Effect.fail(e)
            })
          )
      )

      store.set(addReasonToRemovedClubActionAtom, {
        clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
        reason: ClubDeactivatedNotificationDataO.value.reason,
      })

      console.info(
        `📳 Received notification about club deactivation ${ClubDeactivatedNotificationDataO.value.clubUuid}`
      )

      const clubInfo = store.get(
        createSingleRemovedClubAtom(
          ClubDeactivatedNotificationDataO.value.clubUuid
        )
      )

      if (clubInfo) {
        await notifee.displayNotification({
          title: t(
            `notifications.CLUB_DEACTIVATED.${ClubDeactivatedNotificationDataO.value.reason}.title`
          ),
          body: t(
            `notifications.CLUB_DEACTIVATED.${ClubDeactivatedNotificationDataO.value.reason}.body`,
            {name: clubInfo.clubInfo.name}
          ),
          android: {
            smallIcon: 'notification_icon',
            channelId: await getDefaultChannel(),
            pressAction: {
              id: 'default',
            },
          },
        })

        if (Option.isSome(publicKeyO))
          store.set(addNotificationToCenterActionAtom, {
            _tag: 'ClubDeactivationNotificationData',
            pubKey: publicKeyO.value,
            reason: ClubDeactivatedNotificationDataO.value.reason,
            clubInfo: clubInfo.clubInfo,
          })

        store.set(markRemovedClubAsNotifiedActionAtom, {
          clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
        })
      }

      return
    }

    await showUINotificationFromRemoteMessage(payload)
  } catch (error) {
    void showDebugNotificationIfEnabled({
      title: 'Error while processing notification on background',
      subtitle: 'notifInBackgroundHandler',
      body: (error as Error).message ?? 'no message',
    })
    reportError(
      'error',
      new Error('Error while processing background notification'),
      {
        error,
      }
    )
  } finally {
    getDefaultStore().set(
      reportProcessingNotificationEndActionAtom,
      processUuid
    )
  }
}

async function setupBackgroundMessaging(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
    console.log('📳 Registered background message handler')
  } catch (error) {
    reportError(
      'error',
      new Error('Error while registering background message handler'),
      {
        error,
      }
    )
  }
}

void setupBackgroundMessaging()
