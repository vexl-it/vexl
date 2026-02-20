import {jest} from '@jest/globals'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, HashMap, Layer, Ref} from 'effect'
import {
  LoggedInUsersDbService,
  type LoggedInUsersDbOperations,
  type UserInsert,
} from '../../db/loggedInUsersDb'

const mockedClientEffect = Effect.gen(function* (_) {
  const ref = yield* _(
    Ref.make<HashMap.HashMap<PublicKeyPemBase64, UserInsert>>(HashMap.empty())
  )

  const insertUser = jest.fn<LoggedInUsersDbOperations['insertUser']>((user) =>
    Ref.update(ref, HashMap.set(user.publicKey, user))
  )

  const updatePublicKeyV2 = jest.fn<
    LoggedInUsersDbOperations['updatePublicKeyV2']
  >((_) => Effect.void)

  const deleteUser = jest.fn<LoggedInUsersDbOperations['deleteUser']>(
    (publicKey) => Ref.update(ref, HashMap.remove(publicKey))
  )

  return {
    insertUser,
    updatePublicKeyV2,
    deleteUser,
  }
})

export const mockedUsersDbService = Layer.effect(
  LoggedInUsersDbService,
  mockedClientEffect
)
