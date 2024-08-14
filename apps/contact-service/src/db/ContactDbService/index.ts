import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Context, Effect, Layer} from 'effect'
import {type ContactRecord} from './domain'
import {createDeleteContactsByHashFrom} from './queries/createDeleteContactsByHashFrom'
import {
  createFindCommonFriendsByOwnerHashAndPublicKeys,
  type FindCommonFriendsParams,
  type FindCommonFriendsResult,
} from './queries/createFindCommonFriendsByOwnerHashAndPublicKeys'
import {createFindContactsByHashFrom} from './queries/createFindContactsByHashFrom'
import {createFindSecondLevelContactsPublicKeysByHashFrom} from './queries/createFindFirstLevelContactsPublicKeysByHashFrom'
import {createFindFirstLevelContactsPublicKeysByHashFrom} from './queries/createFindSecondLevelContactsPublicKeysByHashFrom'
import {
  createInsertContact,
  type InsertContactParams,
} from './queries/createSaveContact'

export interface ContactDbOperations {
  deleteContactsByHashFrom: (
    hash: HashedPhoneNumber
  ) => Effect.Effect<void, UnexpectedServerError>

  findContactsByHashFrom: (
    hash: HashedPhoneNumber
  ) => Effect.Effect<readonly ContactRecord[], UnexpectedServerError>

  insertContact: (
    contact: InsertContactParams
  ) => Effect.Effect<void, UnexpectedServerError>

  findFirstLevelContactsPublicKeysByHashFrom: (
    hash: HashedPhoneNumber
  ) => Effect.Effect<readonly PublicKeyPemBase64[], UnexpectedServerError>

  findSecondLevelContactsPublicKeysByHashFrom: (
    hash: HashedPhoneNumber
  ) => Effect.Effect<readonly PublicKeyPemBase64[], UnexpectedServerError>

  findCommonFriends: (
    args: FindCommonFriendsParams
  ) => Effect.Effect<readonly FindCommonFriendsResult[], UnexpectedServerError>
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
      const findFirstLevelContactsPublicKeysByHashFrom = yield* _(
        createFindFirstLevelContactsPublicKeysByHashFrom
      )
      const findSecondLevelContactsPublicKeysByHashFrom = yield* _(
        createFindSecondLevelContactsPublicKeysByHashFrom
      )
      const findCommonFriends = yield* _(
        createFindCommonFriendsByOwnerHashAndPublicKeys
      )

      return {
        deleteContactsByHashFrom,
        findContactsByHashFrom,
        insertContact,
        findFirstLevelContactsPublicKeysByHashFrom,
        findSecondLevelContactsPublicKeysByHashFrom,
        findCommonFriends,
      }
    })
  )
}
