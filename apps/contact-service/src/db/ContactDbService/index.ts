import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {type ServerHashedNumber} from '../../utils/serverHashContact'
import {type ContactRecord} from './domain'
import {createDeleteContactsByHashFrom} from './queries/createDeleteContactsByHashFrom'
import {
  createFindCommonFriendsByOwnerHashAndPublicKeysPaginated,
  type FindCommonFriendsPaginatedParams,
  type FindCommonFriendsPaginatedResult,
} from './queries/createFindCommonFriendsByOwnerHashAndPublicKeysPaginated'
import {createFindContactsByHashFrom} from './queries/createFindContactsByHashFrom'
import {
  createFindFirstLevelContactsPublicKeysByHashFromPaginated,
  type FindFirstLevelContactsPublicKeysByHashFromPaginatedParams,
  type FindFirstLevelContactsPublicKeysByHashFromPaginatedResult,
} from './queries/createFindFirstLevelContactsPublicKeysByHashFromPaginated'
import {
  createFindNotificationTokensByFilter,
  type FindNotificationTokensByFiltersArgs,
  type FindNotificationTokensByFiltersResult,
} from './queries/createFindNotificationTokensByFilter'
import {
  createFindSecondLevelContactsPublicKeysByHashFromPaginated,
  type FindSecondLevelContactsPublicKeysByHashFromPaginatedParams,
  type FindSecondLevelContactsPublicKeysByHashFromPaginatedResult,
} from './queries/createFindSecondLevelContactsPublicKeysByHashFromPaginated'
import {
  createInsertContact,
  type InsertContactParams,
} from './queries/createSaveContact'

export interface ContactDbOperations {
  deleteContactsByHashFrom: (
    hash: ServerHashedNumber
  ) => Effect.Effect<void, UnexpectedServerError>

  findContactsByHashFrom: (
    hash: ServerHashedNumber
  ) => Effect.Effect<readonly ContactRecord[], UnexpectedServerError>

  insertContact: (
    contact: InsertContactParams
  ) => Effect.Effect<void, UnexpectedServerError>

  findFirstLevelContactsPublicKeysByHashFromPaginated: (
    args: FindFirstLevelContactsPublicKeysByHashFromPaginatedParams
  ) => Effect.Effect<
    readonly FindFirstLevelContactsPublicKeysByHashFromPaginatedResult[],
    UnexpectedServerError
  >

  findSecondLevelContactsPublicKeysByHashFromPaginated: (
    args: FindSecondLevelContactsPublicKeysByHashFromPaginatedParams
  ) => Effect.Effect<
    readonly FindSecondLevelContactsPublicKeysByHashFromPaginatedResult[],
    UnexpectedServerError
  >

  findCommonFriendsPaginated: (
    args: FindCommonFriendsPaginatedParams
  ) => Effect.Effect<
    readonly FindCommonFriendsPaginatedResult[],
    UnexpectedServerError
  >

  findNotificationTokensByFilter: (
    args: FindNotificationTokensByFiltersArgs
  ) => Effect.Effect<
    readonly FindNotificationTokensByFiltersResult[],
    UnexpectedServerError
  >
}

export class ContactDbService extends Context.Tag('ContactDbService')<
  ContactDbService,
  ContactDbOperations
>() {
  static readonly Live = Layer.effect(
    ContactDbService,
    Effect.gen(function* (_) {
      const deleteContactsByHashFrom = yield* _(createDeleteContactsByHashFrom)
      const findContactsByHashFrom = yield* _(createFindContactsByHashFrom)
      const insertContact = yield* _(createInsertContact)
      const findFirstLevelContactsPublicKeysByHashFromPaginated = yield* _(
        createFindFirstLevelContactsPublicKeysByHashFromPaginated
      )
      const findSecondLevelContactsPublicKeysByHashFromPaginated = yield* _(
        createFindSecondLevelContactsPublicKeysByHashFromPaginated
      )
      const findCommonFriendsPaginated = yield* _(
        createFindCommonFriendsByOwnerHashAndPublicKeysPaginated
      )
      const findNotificationTokensByFilter = yield* _(
        createFindNotificationTokensByFilter
      )

      return {
        deleteContactsByHashFrom,
        findContactsByHashFrom,
        insertContact,
        findFirstLevelContactsPublicKeysByHashFromPaginated,
        findSecondLevelContactsPublicKeysByHashFromPaginated,
        findNotificationTokensByFilter,
        findCommonFriendsPaginated,
      }
    })
  )
}
