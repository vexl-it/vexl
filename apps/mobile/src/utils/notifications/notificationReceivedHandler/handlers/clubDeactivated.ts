import {type ClubDeactivatedNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect, Option, Record} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {addNotificationToCenterActionAtom} from '../../../../components/NotificationsScreen/state'
import {clubsToKeyHolderAtom} from '../../../../state/clubs/atom/clubsToKeyHolderV2Atom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from '../../../../state/clubs/atom/refreshClubsActionAtom'
import {
  addReasonToRemovedClubActionAtom,
  createSingleRemovedClubAtom,
  markRemovedClubAsNotifiedActionAtom,
} from '../../../../state/clubs/atom/removedClubsAtom'
import {translationAtom} from '../../../localization/I18nProvider'
import {displayLocalNotification} from '../../displayLocalNotification'
import {getDefaultChannel} from '../../notificationChannels'

export function handleClubDeactivatedNotification(
  notificationData: ClubDeactivatedNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const store = getDefaultStore()
    const {t} = store.get(translationAtom)
    const publicKeyO = Record.get(
      store.get(clubsToKeyHolderAtom),
      notificationData.clubUuid
    ).pipe(Option.map((k) => k.keyPair.publicKey))

    yield* store
      .set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
        clubUuid: notificationData.clubUuid,
      })
      .pipe(
        Effect.catchAll((e) => {
          if (
            e._tag === 'ClubNotFoundError' ||
            e._tag === 'FetchingClubError' ||
            e._tag === 'NoSuchElementException'
          )
            return Effect.void

          return Effect.fail(e)
        })
      )

    store.set(addReasonToRemovedClubActionAtom, {
      clubUuid: notificationData.clubUuid,
      reason: notificationData.reason,
    })

    yield* Effect.log(
      'Received notification about club deactivation',
      notificationData.clubUuid
    )

    const clubInfo = store.get(
      createSingleRemovedClubAtom(notificationData.clubUuid)
    )

    if (!clubInfo) return

    yield* Effect.promise(async () => {
      await displayLocalNotification({
        channelId: await getDefaultChannel(),
        content: {
          title: t(
            `notifications.CLUB_DEACTIVATED.${notificationData.reason}.title`
          ),
          body: t(
            `notifications.CLUB_DEACTIVATED.${notificationData.reason}.body`,
            {name: clubInfo.clubInfo.name}
          ),
        },
      })
    })

    if (Option.isSome(publicKeyO))
      store.set(addNotificationToCenterActionAtom, {
        _tag: 'ClubDeactivationNotificationData',
        pubKey: publicKeyO.value,
        reason: notificationData.reason,
        clubInfo: clubInfo.clubInfo,
      })

    store.set(markRemovedClubAsNotifiedActionAtom, {
      clubUuid: notificationData.clubUuid,
    })
  })
}
