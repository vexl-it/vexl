import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Context, Effect, Layer} from 'effect'
import {type ContactRecord} from './domain'
import {createDeleteContactsByHashFrom} from './queries/createDeleteContactsByHashFrom'
import {
  createFindCommonFriendsByOwnerHashAndPublicKeysPaginated,
  type FindCommonFriendsPaginatedParams,
  type FindCommonFriendsPaginatedResult,
} from './queries/createFindCommonFriendsByOwnerHashAndPublicKeysPaginated'
import {createFindContactsByHashFrom} from './queries/createFindContactsByHashFrom'
import {
  createFindContactsOfAccountByPublicKey,
  type FindContactsOfAccountByPublicKeyResult,
} from './queries/createFindContactsOfAccountByPublicKey'
import {
  createFindFirstLevelContactsPublicKeysByHashFromPaginated,
  type FindFirstLevelContactsPublicKeysByHashFromPaginatedParams,
  type FindFirstLevelContactsPublicKeysByHashFromPaginatedResult,
} from './queries/createFindFirstLevelContactsPublicKeysByHashFromPaginated'
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

  findContactsOfAccountByPublicKey: (
    publicKey: PublicKeyPemBase64
  ) => Effect.Effect<
    readonly FindContactsOfAccountByPublicKeyResult[],
    UnexpectedServerError
  >

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
      const findContactsOfAccountByPublicKey = yield* _(
        createFindContactsOfAccountByPublicKey
      )
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

      return {
        deleteContactsByHashFrom,
        findContactsByHashFrom,
        findContactsOfAccountByPublicKey,
        insertContact,
        findFirstLevelContactsPublicKeysByHashFromPaginated,
        findSecondLevelContactsPublicKeysByHashFromPaginated,
        findCommonFriendsPaginated,
      }
    })
  )
}
