import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import dayjs from 'dayjs'
import {Array, Effect, Option, pipe} from 'effect'
import {clubRemoveAfterMarkedAsDeletedDaysConfig} from '../../configs'
import {ClubInvitationLinkDbService} from '../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../db/ClubMemberDbService'
import {ClubsDbService} from '../../db/ClubsDbService'
import {type ClubDbRecord} from '../../db/ClubsDbService/domain'
import {UserNotificationService} from '../../services/UserNotificationService'

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

const deactivateClubsAndSendNotifications = Effect.gen(function* (_) {
  const clubsDb = yield* _(ClubsDbService)
  const userNotificationService = yield* _(UserNotificationService)

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
      userNotificationService.notifyUsersAboutExpiredClub(
        expiredClub.id,
        expiredClub.uuid
      )
    ),
    Effect.all
  )

  yield* _(
    flaggedClubs,
    Array.map((flaggedClub) =>
      userNotificationService.notifyUsersAboutFlaggedClub(
        flaggedClub.id,
        flaggedClub.uuid
      )
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
