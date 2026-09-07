import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  BadShortLivedTokenForErasingUserOnContactServiceError,
  type ShortLivedTokenForErasingUserOnContactService,
} from '@vexl-next/domain/src/general/ShortLivedTokenForErasingUserOnContactService'
import {createShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql/SqlClient'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
} from '../contacts/utils'

beforeEach(async () => {
  // TODO mock user with the contacts
})

describe('Erase user from network', () => {
  it('Deletes user from network', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const networkOne = yield* Effect.all([
          generateKeysAndHasheForNumber('+420733333001'),
          generateKeysAndHasheForNumber('+420733333002'),
          generateKeysAndHasheForNumber('+420733333003'),
          generateKeysAndHasheForNumber('+420733333004'),
          generateKeysAndHasheForNumber('+420733333005'),
        ])

        yield* Effect.forEach(networkOne, (oneUser) =>
          createAndImportUsersFromNetwork(oneUser, networkOne)
        )

        const networkTwo = yield* Effect.all([
          generateKeysAndHasheForNumber('+420733333101'),
          generateKeysAndHasheForNumber('+420733333102'),
          generateKeysAndHasheForNumber('+420733333106'),
          generateKeysAndHasheForNumber('+420733333107'),
          generateKeysAndHasheForNumber('+420733333108'),
        ])

        yield* Effect.forEach(networkTwo, (twoUser) =>
          createAndImportUsersFromNetwork(twoUser, [
            // ...networkTwo,
            ...networkOne,
          ])
        )

        const sql = yield* SqlClient
        const [fr] = yield* sql`
          SELECT
            count(*) AS COUNT
          FROM
            user_contact
          WHERE
            hash_from = ${networkOne[0].serverHashedNumber}
        `
        expect(Number(fr.count)).toBeGreaterThan(0)

        const token = yield* createShortLivedTokenForErasingUser(
          networkOne[0].hashedNumber
        )
        const app = yield* NodeTestingApp
        yield* app.User.eraseUserFromNetwork({
          payload: {
            token,
          },
        })

        const [fr2] = yield* sql`
          SELECT
            count(*) AS COUNT
          FROM
            user_contact
          WHERE
            hash_from = ${networkOne[0].serverHashedNumber}
        `
        expect(Number(fr2.count)).toEqual(0)

        const [userInDb] = yield* sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${networkOne[0].keys.publicKeyPemBase64}
        `
        expect(userInDb).toBeUndefined()
      })
    )
  })
  it('does not fail when user does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const hash =
          'm5xnyoIJ/PxrmAl+O7pmLismIMNBnS4OSgOJ/pWAQAI=' as HashedPhoneNumber
        const token = yield* createShortLivedTokenForErasingUser(hash)
        const app = yield* NodeTestingApp
        yield* app.User.eraseUserFromNetwork({
          payload: {
            token,
          },
        })
      })
    )
  })

  it('Fails when token is invalid', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const errorResponse = yield* pipe(
          app.User.eraseUserFromNetwork({
            payload: {
              token: 'invalid' as ShortLivedTokenForErasingUserOnContactService,
            },
          }),
          Effect.result
        )
        expectErrorResponse(
          BadShortLivedTokenForErasingUserOnContactServiceError
        )(errorResponse)
      })
    )
  })
})
