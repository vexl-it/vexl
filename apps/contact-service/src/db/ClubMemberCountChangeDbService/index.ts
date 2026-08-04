import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {
  createDeleteForClub,
  type DeleteForClubParams,
} from './queries/createDeleteForClub'
import {
  createDeleteOlderThanDays,
  type DeleteOlderThanDaysParams,
} from './queries/createDeleteOlderThanDays'
import {
  createIncrementJoined,
  type IncrementJoinedParams,
} from './queries/createIncrementJoined'
import {
  createIncrementLeft,
  type IncrementLeftParams,
} from './queries/createIncrementLeft'

export interface ClubMemberCountChangeDbOperations {
  incrementJoined: (
    params: IncrementJoinedParams
  ) => Effect.Effect<void, UnexpectedServerError>
  incrementLeft: (
    params: IncrementLeftParams
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteForClub: (
    params: DeleteForClubParams
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteOlderThanDays: (
    params: DeleteOlderThanDaysParams
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class ClubMemberCountChangeDbService extends Context.Tag(
  'ClubMemberCountChangeDbService'
)<ClubMemberCountChangeDbService, ClubMemberCountChangeDbOperations>() {
  static readonly Live = Layer.effect(
    ClubMemberCountChangeDbService,
    Effect.gen(function* (_) {
      const incrementJoined = yield* _(createIncrementJoined)
      const incrementLeft = yield* _(createIncrementLeft)
      const deleteForClub = yield* _(createDeleteForClub)
      const deleteOlderThanDays = yield* _(createDeleteOlderThanDays)

      return {
        incrementJoined,
        incrementLeft,
        deleteForClub,
        deleteOlderThanDays,
      }
    })
  )
}
