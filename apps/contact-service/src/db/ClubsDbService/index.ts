import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type ClubDbRecord} from './domain'
import {
  createDeleteClub,
  type DeleteClubParams,
} from './queries/createDeleteClubs'
import {createFindClub, type FindClubParams} from './queries/createFindClub'
import {
  createFindClubByUuid,
  type findClubByUuidParams,
} from './queries/createFindClubByClubUuid'
import {
  createInsertClub,
  type InsertClubParams,
} from './queries/createInsertClub'
import {
  createUpdateClub,
  type UpdateClubParams,
} from './queries/createUpdateClub'

export interface ClubsDbOperations {
  deleteClub: (
    params: DeleteClubParams
  ) => Effect.Effect<void, UnexpectedServerError>
  findClub: (
    params: FindClubParams
  ) => Effect.Effect<Option.Option<ClubDbRecord>, UnexpectedServerError>
  findClubByUuid: (
    params: findClubByUuidParams
  ) => Effect.Effect<Option.Option<ClubDbRecord>, UnexpectedServerError>
  insertClub: (
    params: InsertClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  updateClub: (
    params: UpdateClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
}

export class ClubsDbService extends Context.Tag('ClubsDbService')<
  ClubsDbService,
  ClubsDbOperations
>() {
  static readonly Live = Layer.effect(
    ClubsDbService,
    Effect.gen(function* (_) {
      const deleteClub = yield* _(createDeleteClub)
      const findClub = yield* _(createFindClub)
      const findClubByUuid = yield* _(createFindClubByUuid)
      const insertClub = yield* _(createInsertClub)
      const updateClub = yield* _(createUpdateClub)

      return {
        deleteClub,
        findClub,
        findClubByUuid,
        insertClub,
        updateClub,
      }
    })
  )
}
