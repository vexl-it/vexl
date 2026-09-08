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

export class ContactDbService extends Context.Service<
  ContactDbService,
  ContactDbOperations
>()('ContactDbService') {
  static readonly Live = Layer.effect(
    ContactDbService,
    Effect.gen(function* () {
      const deleteContactsByHashFrom = yield* createDeleteContactsByHashFrom
      const findContactsByHashFrom = yield* createFindContactsByHashFrom
      const insertContact = yield* createInsertContact
      const findFirstLevelContactsPublicKeysByHashFromPaginated =
        yield* createFindFirstLevelContactsPublicKeysByHashFromPaginated
      const findSecondLevelContactsPublicKeysByHashFromPaginated =
        yield* createFindSecondLevelContactsPublicKeysByHashFromPaginated
      const findCommonFriendsPaginated =
        yield* createFindCommonFriendsByOwnerHashAndPublicKeysPaginated
      const findNotificationTokensByFilter =
        yield* createFindNotificationTokensByFilter

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
