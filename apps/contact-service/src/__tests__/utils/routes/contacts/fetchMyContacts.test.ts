import {HttpClientRequest} from '@effect/platform'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/src/Pagination.brand'
import {Array, Effect, Order, pipe} from 'effect'
import {NodeTestingApp} from '../../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  type DummyUser,
} from './utils'

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
        const {items} = yield* _(
          app.fetchMyContacts(
            {
              query: {level: 'FIRST' as const, page: 0, limit: MAX_PAGE_SIZE},
            },
            HttpClientRequest.setHeaders(networkOne[0].authHeaders)
          )
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
            userContacts,
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })
  it('Propely fetches second level contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const app = yield* _(NodeTestingApp)
        const {items} = yield* _(
          app.fetchMyContacts(
            {
              query: {level: 'SECOND' as const, page: 0, limit: MAX_PAGE_SIZE},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
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
  it('Properly fetches all level contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const app = yield* _(NodeTestingApp)
        const {items} = yield* _(
          app.fetchMyContacts(
            {
              query: {level: 'ALL' as const, page: 0, limit: MAX_PAGE_SIZE},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
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
