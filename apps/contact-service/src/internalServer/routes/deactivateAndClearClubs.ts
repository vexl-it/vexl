import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ClubDeactivatedNotificationData} from '@vexl-next/domain/src/general/notifications'
import dayjs from 'dayjs'
import {Array, Effect, flow, Option, pipe} from 'effect'
import {isNotNullable} from 'effect/Predicate'
import {clubRemoveAfterMarkedAsDeletedDaysConfig} from '../../configs'
import {ClubInvitationLinkDbService} from '../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../db/ClubMemberDbService'
import {ClubsDbService} from '../../db/ClubsDbService'
import {type ClubDbRecord} from '../../db/ClubsDbService/domain'
import {type UserDbService} from '../../db/UserDbService'
import {sendExpoNotificationToAllHandleNonExistingTokens} from '../../utils/expoNotifications'
import {type ExpoNotificationsService} from '../../utils/expoNotifications/ExpoNotificationsService'

const findExpiredClubs = ClubsDbService.pipe(
  Effect.flatMap((one) => one.listExpiredClubs())
)

const findFlaggedClubs = ClubsDbService.pipe(
  Effect.flatMap((one) => one.listClubsWithExceededReportsCount())
)

const removeClubCompletely = (
  club: ClubDbRecord
): Effect.Effect<
  void,
  UnexpectedServerError,
  ClubsDbService | ClubInvitationLinkDbService | ClubMembersDbService
> =>
  Effect.gen(function* (_) {
    const clubsDb = yield* _(ClubsDbService)
    const linkDb = yield* _(ClubInvitationLinkDbService)
    const membersDb = yield* _(ClubMembersDbService)

    yield* _(Effect.log('Removing club', club.id))

    yield* _(Effect.log('Removing invitation links'))
    yield* _(linkDb.deleteInvitationLinksForClub({clubId: club.id}))

    yield* _(Effect.log('Removing club members'))
    yield* _(membersDb.deleteAllClubMembers({clubId: club.id}))

    yield* _(Effect.log('Removing club'))
    yield* _(clubsDb.deleteClub({id: club.id}))

    yield* _(Effect.log('Club removed', club))
  }).pipe(
    Effect.withSpan('removeClubCompletely', {attributes: {id: club.id, club}})
  )

const sendNotificationToMembers = (
  club: ClubDbRecord,
  reason: ClubDeactivatedNotificationData['reason']
): Effect.Effect<
  void,
  UnexpectedServerError,
  ClubMembersDbService | ExpoNotificationsService | UserDbService
> =>
  Effect.gen(function* (_) {
    const membersDb = yield* _(ClubMembersDbService)
    const notificationTokensToSendTo = yield* _(
      membersDb.queryAllClubMembers({id: club.id}),
      Effect.map(
        flow(
          Array.map((one) => one.notificationToken),
          Array.filter(isNotNullable)
        )
      )
    )

    const notificationToIssue = new ClubDeactivatedNotificationData({
      clubUuid: club.uuid,
      reason,
    })

    yield* _(
      sendExpoNotificationToAllHandleNonExistingTokens({
        data: notificationToIssue.toData(),
        tokens: notificationTokensToSendTo,
      })
    )
  }).pipe(
    Effect.withSpan('sendNotificationToMembers', {attributes: {club, reason}})
  )

const deactivateClubsAndSendNotifications = Effect.gen(function* (_) {
  const clubsDb = yield* _(ClubsDbService)

  const expiredClubs = yield* _(findExpiredClubs)
  const flaggedClubs = yield* _(findFlaggedClubs)

  const idsOfClubsToDeactivate = [...expiredClubs, ...flaggedClubs].map(
    (club) => club.id
  )

  yield* _(Effect.log('Deactivating clubs', idsOfClubsToDeactivate))

  yield* _(clubsDb.updateSetClubsInactive({id: idsOfClubsToDeactivate}))
  yield* _(
    expiredClubs,
    Array.map((expiredClub) =>
      sendNotificationToMembers(expiredClub, 'EXPIRED')
    ),
    Effect.all
  )
  yield* _(
    flaggedClubs,
    Array.map((expiredClub) =>
      sendNotificationToMembers(expiredClub, 'FLAGGED')
    ),
    Effect.all
  )
}).pipe(Effect.withSpan('deactivateClubsAndSendNotifications'))

const clearDeactivatedClubs = Effect.gen(function* (_) {
  const clubsDb = yield* _(ClubsDbService)

  const removeAfterDays = yield* _(clubRemoveAfterMarkedAsDeletedDaysConfig)
  const deactivatedClubs = yield* _(clubsDb.listInactiveClubs())

  const removeBeforeDate = dayjs()
    .startOf('day')
    .subtract(removeAfterDays, 'days')
    .toDate()

  const clubsToRemove = pipe(
    deactivatedClubs,
    Array.filter(
      (one) =>
        Option.isSome(one.madeInactiveAt) &&
        one.madeInactiveAt.value <= removeBeforeDate
    )
  )

  yield* _(Effect.log('Removing clubs', clubsToRemove))
  yield* _(clubsToRemove, Array.map(removeClubCompletely), Effect.all)
}).pipe(Effect.withSpan('clearDeactivatedClubs'))

export const deactivateAndClearClubs = Effect.gen(function* (_) {
  yield* _(deactivateClubsAndSendNotifications)
  yield* _(clearDeactivatedClubs)
}).pipe(Effect.withSpan('deactivateAndClearClubs'))
