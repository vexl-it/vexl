import {SqlClient} from '@effect/sql'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Array, Effect, Option, Schema} from 'effect'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'
import {type DummyUser} from '../routes/contacts/utils'
import {type MockedContexts} from './runPromiseInMockedEnvironment'

export type TestEffect<A> = Effect.Effect<A, unknown, MockedContexts>

// Another phone number of the same account: same keys, own hash, no token.
export const generateAnotherNumber = (
  account: DummyUser,
  numberRaw: string
): TestEffect<DummyUser> =>
  Effect.gen(function* (_) {
    const phoneNumber = Schema.decodeSync(E164PhoneNumber)(numberRaw)
    const hashedNumber = yield* _(hashPhoneNumber(phoneNumber))
    const serverHashedNumber = yield* _(serverHashPhoneNumber(hashedNumber))
    return {
      ...account,
      phoneNumber,
      hashedNumber,
      authHeaders: yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: account.keys.publicKeyPemBase64,
        })
      ),
      vexlNotificationToken: Option.none(),
      serverHashedNumber,
      serverHashedNumberForClient: yield* _(hashForClient(serverHashedNumber)),
    }
  })

export const findPublicKeysOfHash = (
  hash: ServerHashedNumber
): TestEffect<readonly string[]> =>
  Effect.flatMap(SqlClient.SqlClient, (sql) =>
    sql<{publicKey: string}>`
      SELECT
        public_key
      FROM
        users
      WHERE
        hash = ${hash}
    `.pipe(Effect.map(Array.map((row) => row.publicKey)))
  )

export const countContactsOf = (hash: ServerHashedNumber): TestEffect<number> =>
  Effect.flatMap(SqlClient.SqlClient, (sql) =>
    sql<{count: string}>`
      SELECT
        count(*) AS count
      FROM
        user_contact
      WHERE
        hash_from = ${hash}
    `.pipe(Effect.map(([row]) => Number(row?.count)))
  )
