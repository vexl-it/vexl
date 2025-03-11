import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ClubUserLimitExceededError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {type ClubDbRecord} from '../../../db/ClubsDbService/domain'

export const clubHasCapacityForAnotherUser = ({
  id: clubId,
  membersCountLimit,
}: ClubDbRecord): Effect.Effect<
  number,
  UnexpectedServerError | ClubUserLimitExceededError,
  ClubMembersDbService
> =>
  ClubMembersDbService.pipe(
    Effect.flatMap((membersDb) =>
      membersDb.countClubMembers({
        id: clubId,
      })
    ),
    Effect.filterOrFail(
      (usersInClub) => usersInClub + 1 <= membersCountLimit,
      () => new ClubUserLimitExceededError()
    ),
    Effect.map((count) => count + 1)
  )
