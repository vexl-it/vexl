import {SqlClient} from '@effect/sql/SqlClient'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Order, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  type DummyUser,
} from './utils'

const MAX_PAGE_SIZE = 2147483647

let networkOne: [DummyUser, ...DummyUser[]]
let networkTwo: [DummyUser, ...DummyUser[]]

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      networkOne = yield* _(
        Effect.all([
          generateKeysAndHasheForNumber('+420733333001'),
          generateKeysAndHasheForNumber('+420733333002'),
          generateKeysAndHasheForNumber('+420733333003'),
          generateKeysAndHasheForNumber('+420733333004'),
          generateKeysAndHasheForNumber('+420733333005'),
        ])
      )

      yield* _(
        Effect.forEach(networkOne, (oneUser) =>
          createAndImportUsersFromNetwork(oneUser, networkOne)
        )
      )

      networkTwo = yield* _(
        Effect.all([
          generateKeysAndHasheForNumber('+420733333101'),
          generateKeysAndHasheForNumber('+420733333102'),
          generateKeysAndHasheForNumber('+420733333106'),
          generateKeysAndHasheForNumber('+420733333107'),
          generateKeysAndHasheForNumber('+420733333108'),
        ])
      )

      yield* _(
        Effect.forEach(networkTwo, (twoUser) =>
          createAndImportUsersFromNetwork(twoUser, [
            // ...networkTwo,
            ...networkOne,
          ])
        )
      )
    })
  )
})

describe('Fetch my contacts', () => {
  it('Properly fetches first level contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]

        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(networkOne[0].authHeaders))
        const {items} = yield* _(
          app.Contact.fetchMyContacts({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"Some test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {level: 'FIRST' as const, page: 0, limit: MAX_PAGE_SIZE},
          })
        )

        const sql = yield* _(SqlClient)

        const userInDb = yield* _(sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${me.keys.publicKeyPemBase64}
        `)
        expect(userInDb).toHaveLength(1)
        expect(userInDb[0]).toHaveProperty('appSource', 'Some test')

        expect(
          pipe(
            items,
            Array.map((o) => o.publicKey),
            Array.sort(Order.string),
            Array.join(',')
          )
        ).toBe(
          pipe(
            userContacts,
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })

  it('Properly fetches second level contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))
        const {items} = yield* _(
          app.Contact.fetchMyContacts({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"googlePlay", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {
              level: 'SECOND' as const,
              page: 0,
              limit: MAX_PAGE_SIZE,
            },
          })
        )

        console.log('me', me.keys.publicKeyPemBase64)

        console.log(
          `Items: ${JSON.stringify(
            items.map((o) => o.publicKey),
            null,
            2
          )}`
        )
        console.log(
          `Should return: ${JSON.stringify(
            [...networkTwo, ...userContacts].map(
              (o) => o.keys.publicKeyPemBase64
            ),
            null,
            2
          )}`
        )

        expect(
          pipe(
            items,
            Array.map((o) => o.publicKey),
            Array.sort(Order.string),
            Array.join(',')
          )
        ).toBe(
          pipe(
            [...networkTwo, ...userContacts],
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })

  it('Properly fetches all level contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))
        const {items} = yield* _(
          app.Contact.fetchMyContacts({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"googlePlay", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {level: 'ALL' as const, page: 0, limit: MAX_PAGE_SIZE},
          })
        )

        console.log('me', me.keys.publicKeyPemBase64)

        expect(
          pipe(
            items,
            Array.map((o) => o.publicKey),
            Array.sort(Order.string),
            Array.join(',')
          )
        ).toBe(
          pipe(
            [...networkTwo, ...userContacts],
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })
})
