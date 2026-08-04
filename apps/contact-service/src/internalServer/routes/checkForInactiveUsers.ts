import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import dayjs from 'dayjs'
import {Array, Effect, HashMap, Option, pipe} from 'effect'
import {clubMemberExpirationAfterDaysOfInactivityConfig} from '../../configs'
import {ClubMemberCountChangeDbService} from '../../db/ClubMemberCountChangeDbService'
import {ClubMembersDbService} from '../../db/ClubMemberDbService'
import {type ClubRecordId} from '../../db/ClubsDbService/domain'

export const checkForInactiveUsers = Effect.gen(function* (_) {
  // Notification not issued since that is handled in ./processUserInactivty. Here we are just kicking out users that are not active for some period of time.

  yield* _(Effect.log('Checking and removing inactive users'))

  const clubMemberExpirationAfterDaysOfInactivity = yield* _(
    clubMemberExpirationAfterDaysOfInactivityConfig
  )
  const lastActiveBefore = dayjs()
    .startOf('day')
    .subtract(clubMemberExpirationAfterDaysOfInactivity)

  const deletedMembers = yield* _(
    ClubMembersDbService,
    Effect.flatMap((clubMembersDb) =>
      clubMembersDb.deleteClubMembersLastActiveBefore({
        lastActiveBefore: lastActiveBefore.toDate(),
      })
    )
  )

  const deletedCountByClub = pipe(
    deletedMembers,
    Array.reduce(HashMap.empty<ClubRecordId, number>(), (counts, member) =>
      HashMap.set(
        counts,
        member.clubId,
        pipe(
          HashMap.get(counts, member.clubId),
          Option.getOrElse(() => 0)
        ) + 1
      )
    ),
    HashMap.toEntries
  )
  const memberCountChangesDb = yield* _(ClubMemberCountChangeDbService)
  yield* _(
    deletedCountByClub,
    Array.map(([clubId, count]) =>
      memberCountChangesDb.incrementLeft({clubId, count})
    ),
    Effect.all
  )
}).pipe(withDbTransaction, Effect.withSpan('checkForInactiveUsers'))
