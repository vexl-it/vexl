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
  type FindClubByUuidParams,
} from './queries/createFindClubByClubUuid'
import {
  createInsertClub,
  type InsertClubParams,
} from './queries/createInsertClub'
import {createListClubs} from './queries/createListClubs'
import {createListExpiredClubs} from './queries/createListExpiredClubs'
import {createListInactiveClubs} from './queries/createListInactiveClubs'
import {
  createUpdateClub,
  type UpdateClubParams,
} from './queries/createUpdateClub'
import {
  createUpdateSetClubsInactive,
  type UpdateSetClubsInactiveParams,
} from './queries/createUpdateSetClubsInactive'

export interface ClubsDbOperations {
  deleteClub: (
    params: DeleteClubParams
  ) => Effect.Effect<void, UnexpectedServerError>
  findClub: (
    params: FindClubParams
  ) => Effect.Effect<Option.Option<ClubDbRecord>, UnexpectedServerError>
  findClubByUuid: (
    params: FindClubByUuidParams
  ) => Effect.Effect<Option.Option<ClubDbRecord>, UnexpectedServerError>
  insertClub: (
    params: InsertClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  updateClub: (
    params: UpdateClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  updateSetClubsInactive: (
    params: UpdateSetClubsInactiveParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  listClubs: () => Effect.Effect<readonly ClubDbRecord[], UnexpectedServerError>
  listExpiredClubs: () => Effect.Effect<
    readonly ClubDbRecord[],
    UnexpectedServerError
  >
  listInactiveClubs: () => Effect.Effect<
    readonly ClubDbRecord[],
    UnexpectedServerError
  >
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
      const updateSetClubsInactive = yield* _(createUpdateSetClubsInactive)
      const listClubs = yield* _(createListClubs)
      const listExpiredClubs = yield* _(createListExpiredClubs)
      const listInactiveClubs = yield* _(createListInactiveClubs)

      return {
        deleteClub,
        findClub,
        findClubByUuid,
        insertClub,
        updateClub,
        updateSetClubsInactive,
        listClubs,
        listExpiredClubs,
        listInactiveClubs,
      }
    })
  )
}
