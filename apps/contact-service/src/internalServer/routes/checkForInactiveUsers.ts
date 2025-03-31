import dayjs from 'dayjs'
import {Effect} from 'effect'
import {clubMemberExpirationAfterDaysOfInactivityConfig} from '../../configs'
import {ClubMembersDbService} from '../../db/ClubMemberDbService'

export const checkForInactiveUsers = Effect.gen(function* (_) {
  // Notification not issued since that is handled in ./processUserInactivty. Here we are just kicking out users that are not active for some period of time.

  yield* _(Effect.log('Checking and removing inactive users'))

  const clubMemberExpirationAfterDaysOfInactivity = yield* _(
    clubMemberExpirationAfterDaysOfInactivityConfig
  )
  const lastActiveBefore = dayjs()
    .startOf('day')
    .subtract(clubMemberExpirationAfterDaysOfInactivity)

  yield* _(
    ClubMembersDbService,
    Effect.flatMap((clubMembersDb) =>
      clubMembersDb.deleteClubMembersLastActiveBefore({
        lastActiveBefore: lastActiveBefore.toDate(),
      })
    )
  )
}).pipe(Effect.withSpan('checkForInactiveUsers'))
