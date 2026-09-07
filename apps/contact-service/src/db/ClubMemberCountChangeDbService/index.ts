import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {
  createDeleteForClub,
  type DeleteForClubParams,
} from './queries/createDeleteForClub'
import {
  createIncrementJoined,
  type IncrementJoinedParams,
} from './queries/createIncrementJoined'
import {
  createIncrementLeft,
  type IncrementLeftParams,
} from './queries/createIncrementLeft'
import {
  createListForClub,
  type ListForClubParams,
  type ListForClubResult,
} from './queries/createListForClub'

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
  listForClub: (
    params: ListForClubParams
  ) => Effect.Effect<readonly ListForClubResult[], UnexpectedServerError>
}

export class ClubMemberCountChangeDbService extends Context.Service<
  ClubMemberCountChangeDbService,
  ClubMemberCountChangeDbOperations
>()('ClubMemberCountChangeDbService') {
  static readonly Live = Layer.effect(
    ClubMemberCountChangeDbService,
    Effect.gen(function* () {
      const incrementJoined = yield* createIncrementJoined
      const incrementLeft = yield* createIncrementLeft
      const deleteForClub = yield* createDeleteForClub
      const listForClub = yield* createListForClub

      return {
        incrementJoined,
        incrementLeft,
        deleteForClub,
        listForClub,
      }
    })
  )
}
