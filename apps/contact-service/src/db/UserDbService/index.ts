import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Context, Effect, Layer, type Option} from 'effect'
import {type NotificationTokens, type UserRecord} from './domain'
import {createDeleteUserByPublicKeyAndHash} from './queries/createDeleteUserByPublicKeyAndHash'
import {createFindFirebaseTokensOfInactiveUsers} from './queries/createFindFirebaseTokensOfInactiveUsers'
import {
  createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact,
  type FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams,
  type FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactResult,
} from './queries/createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact'
import {
  createFindTokensOfUsersWhoDirectlyImportedHash,
  type FindTokensOfUsersWhoDirectlyImportedHashParams,
  type FindTokensOfUsersWhoDirectlyImportedHashResult,
} from './queries/createFindTokenOfUsersWhoDirectlyImportedHash'
import {createFindTokensForNewContentNotification} from './queries/createFindTokensForNewContentNotification'
import {createFindUserByHash} from './queries/createFindUserByHash'
import {createFindUserbyPublicKeyAndHash} from './queries/createFindUserByPublicKeyAndHash'
import {
  createInsertUser,
  type CreateUserParams,
} from './queries/createInsertUser'
import {
  createUpdateAppSourceForUser,
  type UpdateAppSourceForUserParams,
} from './queries/createUpdateAppSourceForUser'
import {
  createUpdateExpoToken,
  type UpdateExpoTokenParams,
} from './queries/createUpdateExpoToken'
import {
  createUpdateFirebaseToken,
  type UpdateFirebaseTokenParams,
} from './queries/createUpdateFirebaseToken'
import {createUpdateInvalidateExpoToken} from './queries/createUpdateInvalidateExpoToken'
import {createUpdateInvalidateFirebaseToken} from './queries/createUpdateInvalidateFirebaseToken'
import {
  createUpdateRefreshUser,
  type UpdateRefreshUserParams,
} from './queries/createUpdateRefreshUser'
import {
  createUpdateSetRefreshedAtToNull,
  type UpdateSetRefreshedAtParams,
} from './queries/createUpdateSetRefreshedAtToNull'
import {
  createUpdateUserHash,
  type UpdateUserHashParams,
} from './queries/createUpdateUserHash'
import {
  createUpdateUserInitialImportDone,
  type UpdateUserInitialImportDoneParams,
} from './queries/createUpdateUserInitialImportDone'

export interface UserDbOperations {
  insertUser: (
    args: CreateUserParams
  ) => Effect.Effect<UserRecord, UnexpectedServerError>

  findUserByHash: (
    hash: HashedPhoneNumber
  ) => Effect.Effect<Option.Option<UserRecord>, UnexpectedServerError>

  findUserByPublicKeyAndHash: (args: {
    hash: HashedPhoneNumber
    publicKey: PublicKeyPemBase64
  }) => Effect.Effect<Option.Option<UserRecord>, UnexpectedServerError>

  findFirebaseTokensOfUsersWhoDirectlyImportedHash: (
    args: FindTokensOfUsersWhoDirectlyImportedHashParams
  ) => Effect.Effect<
    readonly FindTokensOfUsersWhoDirectlyImportedHashResult[],
    UnexpectedServerError
  >

  findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact: (
    args: FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams
  ) => Effect.Effect<
    readonly FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactResult[],
    UnexpectedServerError
  >

  findFirebaseTokensOfInactiveUsers: (
    beforeRefreshetAt: Date
  ) => Effect.Effect<readonly NotificationTokens[], UnexpectedServerError>

  findFirebaseTokensForNewContentNotification: (
    beforeRefreshetAt: Date
  ) => Effect.Effect<readonly NotificationTokens[], UnexpectedServerError>

  deleteUserByPublicKeyAndHash: (args: {
    publicKey: PublicKeyPemBase64
    hash: HashedPhoneNumber
  }) => Effect.Effect<void, UnexpectedServerError>

  updateRefreshUser: (
    args: UpdateRefreshUserParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateFirebaseToken: (
    args: UpdateFirebaseTokenParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateExpoToken: (
    args: UpdateExpoTokenParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateInvalidateFirebaseToken: (
    args: FcmToken
  ) => Effect.Effect<void, UnexpectedServerError>

  updateInvalidateExpoToken: (
    args: ExpoNotificationToken
  ) => Effect.Effect<void, UnexpectedServerError>

  updateSetRefreshedAtToNull: (
    args: UpdateSetRefreshedAtParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateUserHash: (
    args: UpdateUserHashParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateUserInitialImportDone: (
    args: UpdateUserInitialImportDoneParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateAppSourceForUser: (
    args: UpdateAppSourceForUserParams
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class UserDbService extends Context.Tag('UserDbService')<
  UserDbService,
  UserDbOperations
>() {
  static readonly Live = Layer.effect(
    UserDbService,
    Effect.gen(function* (_) {
      const insertUser = yield* _(createInsertUser)
      const findUserByHash = yield* _(createFindUserByHash)
      const findUserByPublicKeyAndHash = yield* _(
        createFindUserbyPublicKeyAndHash
      )
      const deleteUserByPublicKeyAndHash = yield* _(
        createDeleteUserByPublicKeyAndHash
      )
      const updateRefreshUser = yield* _(createUpdateRefreshUser)
      const updateFirebaseToken = yield* _(createUpdateFirebaseToken)
      const updateExpoToken = yield* _(createUpdateExpoToken)
      const updateInvalidateFirebaseToken = yield* _(
        createUpdateInvalidateFirebaseToken
      )
      const updateInvalidateExpoToken = yield* _(
        createUpdateInvalidateExpoToken
      )

      const findFirebaseTokensOfUsersWhoDirectlyImportedHash = yield* _(
        createFindTokensOfUsersWhoDirectlyImportedHash
      )
      const findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact = yield* _(
        createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact
      )

      const findFirebaseTokensOfInactiveUsers = yield* _(
        createFindFirebaseTokensOfInactiveUsers
      )

      const updateSetRefreshedAtToNull = yield* _(
        createUpdateSetRefreshedAtToNull
      )

      const findFirebaseTokensForNewContentNotification = yield* _(
        createFindTokensForNewContentNotification
      )

      const updateUserHash = yield* _(createUpdateUserHash)

      const updateUserInitialImportDone = yield* _(
        createUpdateUserInitialImportDone
      )

      const updateAppSourceForUser = yield* _(createUpdateAppSourceForUser)

      return {
        insertUser,
        findUserByHash,
        findUserByPublicKeyAndHash,
        deleteUserByPublicKeyAndHash,
        updateRefreshUser,
        updateFirebaseToken,
        updateExpoToken,
        updateInvalidateFirebaseToken,
        updateInvalidateExpoToken,
        findFirebaseTokensOfUsersWhoDirectlyImportedHash,
        findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact,
        findFirebaseTokensOfInactiveUsers,
        updateSetRefreshedAtToNull,
        findFirebaseTokensForNewContentNotification,
        updateUserHash,
        updateUserInitialImportDone,
        updateAppSourceForUser,
      }
    })
  )
}
