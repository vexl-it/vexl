import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Context, Effect, Layer} from 'effect'
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
import {createFindContactsByHashFrom} from './queries/createFindContactsByHashFrom'
import {createFindFirstLevelContactsPublicKeysByHashFrom} from './queries/createFindFirstLevelContactsPublicKeysByHashFrom'
import {createFindSecondLevelContactsPublicKeysByHashFrom} from './queries/createFindSecondLevelContactsPublicKeysByHashFrom'
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
    hash: HashedPhoneNumber
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteContactsByHashFromAndHashTo: (
    args: DeleteContactsByHashFromAndHashToQuery
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
      const findSecondLevelContactsPublicKeysByHashFrom = yield* _(
        createFindSecondLevelContactsPublicKeysByHashFrom
      )
      const findCommonFriends = yield* _(
        createFindCommonFriendsByOwnerHashAndPublicKeys
      )

      const updateContactHashFrom = yield* _(createUpdateContactsHashFrom)

      return {
        deleteContactsByHashFrom,
        deleteContactsByHashFromAndHashTo,
        findContactsByHashFrom,
        insertContact,
        findFirstLevelContactsPublicKeysByHashFrom,
        findSecondLevelContactsPublicKeysByHashFrom,
        findCommonFriends,
        updateContactHashFrom,
      }
    })
  )
}
