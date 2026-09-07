import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import dayjs from 'dayjs'
import {Array, Effect, Option, pipe} from 'effect'
import {clubRemoveAfterMarkedAsDeletedDaysConfig} from '../../configs'
import {ClubInvitationLinkDbService} from '../../db/ClubInvitationLinkDbService'
import {ClubMemberCountChangeDbService} from '../../db/ClubMemberCountChangeDbService'
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
  | ClubsDbService
  | ClubInvitationLinkDbService
  | ClubMembersDbService
  | ClubMemberCountChangeDbService
> =>
  Effect.gen(function* () {
    const clubsDb = yield* ClubsDbService
    const linkDb = yield* ClubInvitationLinkDbService
    const membersDb = yield* ClubMembersDbService
    const memberCountChangesDb = yield* ClubMemberCountChangeDbService

    yield* Effect.log('Removing club', club.id)

    yield* Effect.log('Removing invitation links')
    yield* linkDb.deleteInvitationLinksForClub({clubId: club.id})

    yield* Effect.log('Removing club members')
    yield* membersDb.deleteAllClubMembers({clubId: club.id})

    yield* Effect.log('Removing club member count changes')
    yield* memberCountChangesDb.deleteForClub({clubId: club.id})

    yield* Effect.log('Removing club')
    yield* clubsDb.deleteClub({id: club.id})

    yield* Effect.log('Club removed', club)
  }).pipe(
    Effect.withSpan('removeClubCompletely', {attributes: {id: club.id, club}})
  )

const deactivateClubsAndSendNotifications = Effect.gen(function* () {
  const clubsDb = yield* ClubsDbService
  const userNotificationService = yield* UserNotificationService

  const expiredClubs = yield* findExpiredClubs
  const flaggedClubs = yield* findFlaggedClubs
  const flaggedClubsToDeactivate = pipe(
    flaggedClubs,
    Array.filter(
      (flaggedClub) =>
        !pipe(
          expiredClubs,
          Array.some((expiredClub) => expiredClub.id === flaggedClub.id)
        )
    )
  )
  const expiredClubIds = pipe(
    expiredClubs,
    Array.map((club) => club.id)
  )
  const flaggedClubIds = pipe(
    flaggedClubsToDeactivate,
    Array.map((club) => club.id)
  )
  const idsOfClubsToDeactivate = pipe(
    expiredClubIds,
    Array.appendAll(flaggedClubIds)
  )

  yield* Effect.log('Deactivating clubs', idsOfClubsToDeactivate)

  if (Array.isArrayNonEmpty(expiredClubIds)) {
    yield* clubsDb.updateSetClubsInactive({
      id: expiredClubIds,
      reason: 'EXPIRED',
    })
  }

  if (Array.isArrayNonEmpty(flaggedClubIds)) {
    yield* clubsDb.updateSetClubsInactive({
      id: flaggedClubIds,
      reason: 'FLAGGED',
    })
  }

  yield* pipe(
    expiredClubs,
    Array.map((expiredClub) =>
      userNotificationService.notifyUsersAboutExpiredClub(
        expiredClub.id,
        expiredClub.uuid
      )
    ),
    Effect.all
  )

  yield* pipe(
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

const clearDeactivatedClubs = Effect.gen(function* () {
  const clubsDb = yield* ClubsDbService

  const removeAfterDays = yield* clubRemoveAfterMarkedAsDeletedDaysConfig
  const deactivatedClubs = yield* clubsDb.listInactiveClubs()

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

  yield* Effect.log('Removing clubs', clubsToRemove)
  yield* pipe(clubsToRemove, Array.map(removeClubCompletely), Effect.all)
}).pipe(Effect.withSpan('clearDeactivatedClubs'))

export const deactivateAndClearClubs = Effect.gen(function* () {
  yield* deactivateClubsAndSendNotifications
  yield* clearDeactivatedClubs
}).pipe(Effect.withSpan('deactivateAndClearClubs'))
