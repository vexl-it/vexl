import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {type ServerHashedNumber} from '../../utils/serverHashContact'
import {type ContactRecord} from './domain'
import {createDeleteContactsByHashFrom} from './queries/createDeleteContactsByHashFrom'
import {
  createDeleteContactsByHashFromAndHashTo,
  type DeleteContactsByHashFromAndHashToQuery,
} from './queries/createDeleteContactsByHashFromAndHashTo'
import {
  createFindCommonFriendsByOwnerHashAndPublicKeys,
  type FindCommonFriendsParams,
  type FindCommonFriendsResult,
} from './queries/createFindCommonFriendsByOwnerHashAndPublicKeys'
import {
  createFindCommonFriendsByOwnerHashAndPublicKeysPaginated,
  type FindCommonFriendsPaginatedParams,
  type FindCommonFriendsPaginatedResult,
} from './queries/createFindCommonFriendsByOwnerHashAndPublicKeysPaginated'
import {createFindContactsByHashFrom} from './queries/createFindContactsByHashFrom'
import {
  createFindFirstLevelContactsPublicKeysByHashFrom,
  type ContactWithV2Key,
} from './queries/createFindFirstLevelContactsPublicKeysByHashFrom'
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
import {createFindSecondLevelContactsPublicKeysByHashFrom} from './queries/createFindSecondLevelContactsPublicKeysByHashFrom'
import {
  createFindSecondLevelContactsPublicKeysByHashFromPaginated,
  type FindSecondLevelContactsPublicKeysByHashFromPaginatedParams,
  type FindSecondLevelContactsPublicKeysByHashFromPaginatedResult,
} from './queries/createFindSecondLevelContactsPublicKeysByHashFromPaginated'
import {
  createInsertContact,
  type InsertContactParams,
} from './queries/createSaveContact'
import {
  createUpdateContactsHashFrom,
  type UpdateContactsHashFromQuery,
} from './queries/createUpdateContactsHashFrom'

export interface ContactDbOperations {
  deleteContactsByHashFrom: (
    hash: ServerHashedNumber
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteContactsByHashFromAndHashTo: (
    args: DeleteContactsByHashFromAndHashToQuery
  ) => Effect.Effect<void, UnexpectedServerError>

  findContactsByHashFrom: (
    hash: ServerHashedNumber
  ) => Effect.Effect<readonly ContactRecord[], UnexpectedServerError>

  insertContact: (
    contact: InsertContactParams
  ) => Effect.Effect<void, UnexpectedServerError>

  findFirstLevelContactsPublicKeysByHashFrom: (
    hash: ServerHashedNumber
  ) => Effect.Effect<readonly ContactWithV2Key[], UnexpectedServerError>

  findFirstLevelContactsPublicKeysByHashFromPaginated: (
    args: FindFirstLevelContactsPublicKeysByHashFromPaginatedParams
  ) => Effect.Effect<
    readonly FindFirstLevelContactsPublicKeysByHashFromPaginatedResult[],
    UnexpectedServerError
  >

  findSecondLevelContactsPublicKeysByHashFrom: (
    hash: ServerHashedNumber
  ) => Effect.Effect<readonly ContactWithV2Key[], UnexpectedServerError>

  findSecondLevelContactsPublicKeysByHashFromPaginated: (
    args: FindSecondLevelContactsPublicKeysByHashFromPaginatedParams
  ) => Effect.Effect<
    readonly FindSecondLevelContactsPublicKeysByHashFromPaginatedResult[],
    UnexpectedServerError
  >

  findCommonFriends: (
    args: FindCommonFriendsParams
  ) => Effect.Effect<readonly FindCommonFriendsResult[], UnexpectedServerError>

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

  updateContactHashFrom: (
    args: UpdateContactsHashFromQuery
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class ContactDbService extends Context.Tag('ContactDbService')<
  ContactDbService,
  ContactDbOperations
>() {
  static readonly Live = Layer.effect(
    ContactDbService,
    Effect.gen(function* (_) {
      const deleteContactsByHashFrom = yield* _(createDeleteContactsByHashFrom)
      const deleteContactsByHashFromAndHashTo = yield* _(
        createDeleteContactsByHashFromAndHashTo
      )
      const findContactsByHashFrom = yield* _(createFindContactsByHashFrom)
      const insertContact = yield* _(createInsertContact)
      const findFirstLevelContactsPublicKeysByHashFrom = yield* _(
        createFindFirstLevelContactsPublicKeysByHashFrom
      )
      const findFirstLevelContactsPublicKeysByHashFromPaginated = yield* _(
        createFindFirstLevelContactsPublicKeysByHashFromPaginated
      )
      const findSecondLevelContactsPublicKeysByHashFrom = yield* _(
        createFindSecondLevelContactsPublicKeysByHashFrom
      )
      const findSecondLevelContactsPublicKeysByHashFromPaginated = yield* _(
        createFindSecondLevelContactsPublicKeysByHashFromPaginated
      )
      const findCommonFriends = yield* _(
        createFindCommonFriendsByOwnerHashAndPublicKeys
      )
      const findCommonFriendsPaginated = yield* _(
        createFindCommonFriendsByOwnerHashAndPublicKeysPaginated
      )
      const findNotificationTokensByFilter = yield* _(
        createFindNotificationTokensByFilter
      )

      const updateContactHashFrom = yield* _(createUpdateContactsHashFrom)

      return {
        deleteContactsByHashFrom,
        deleteContactsByHashFromAndHashTo,
        findContactsByHashFrom,
        insertContact,
        findFirstLevelContactsPublicKeysByHashFrom,
        findFirstLevelContactsPublicKeysByHashFromPaginated,
        findSecondLevelContactsPublicKeysByHashFrom,
        findSecondLevelContactsPublicKeysByHashFromPaginated,
        findNotificationTokensByFilter,
        findCommonFriends,
        findCommonFriendsPaginated,
        updateContactHashFrom,
      }
    })
  )
}
