import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {mockedReportContactsImported} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {Array, Effect, Logger, LogLevel, Order, pipe} from 'effect'
import {sendMessageMock} from '../../mockedFirebaseMessagingService'
import {NodeTestingApp} from '../../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  type DummyUser,
  generateKeysAndHasheForNumber,
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
            ...networkTwo,
            ...networkOne,
          ])
        )
      )
    }).pipe(Logger.withMinimumLogLevel(LogLevel.None))
  )
})

describe('Import contacts', () => {
  beforeEach(() => {
    mockedReportContactsImported.mockClear()
  })

  it('Imports contacts to the database and replaces existing contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const myNewContacts = networkOne.slice(1, 3)

        const sql = yield* _(SqlClient.SqlClient)
        const myOldContactsFromDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${me.hashedNumber}
        `)

        expect(myOldContactsFromDb).toHaveLength(networkOne.length - 1)

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.importContacts(
            {
              body: {contacts: Array.map(myNewContacts, (c) => c.hashedNumber)},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const myContactsFromDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${me.hashedNumber}
        `)

        expect(mockedReportContactsImported).toHaveBeenCalledTimes(1)

        expect(myContactsFromDb).toHaveLength(myNewContacts.length)
      })
    )
  })

  it('Filters duplicities and author hash', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const myNewContacts = [
          ...networkOne.slice(1, 3),
          ...networkOne.slice(1, 3),
          me,
        ]

        const sql = yield* _(SqlClient.SqlClient)

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.importContacts(
            {
              body: {contacts: Array.map(myNewContacts, (c) => c.hashedNumber)},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const myContactsFromDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${me.hashedNumber}
        `)

        expect(myContactsFromDb).toHaveLength(2)
      })
    )
  })

  it('Does not return error when when contact array is empty just empties the imports', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]

        const app = yield* _(NodeTestingApp)
        // first reset user
        yield* _(
          app.importContacts(
            {
              body: {contacts: []},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )
      })
    )
  })
})

describe('Notification', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(Effect.sleep(200))
        sendMessageMock.mockClear()
      })
    )
  })

  it('Notifies other users about new user', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]

        const app = yield* _(NodeTestingApp)

        yield* _(
          app.importContacts(
            {
              body: {contacts: []},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(Effect.sleep(200))
        expect(sendMessageMock).not.toHaveBeenCalled()

        sendMessageMock.mockClear()

        const contactsToImport = Array.filter(
          [...networkOne],
          (one) => one.hashedNumber !== me.hashedNumber
        )

        yield* _(
          app.importContacts(
            {
              body: {
                contacts: Array.map(contactsToImport, (c) => c.hashedNumber),
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(Effect.sleep(200))

        const call = sendMessageMock.mock.calls[0][0]

        expect(
          pipe(call.tokens, Array.sort(Order.string), Array.join(','))
        ).toBe(
          pipe(
            [...networkOne, ...networkTwo],
            Array.filter((one) => one.firebaseToken !== me.firebaseToken),
            Array.map((c) => c.firebaseToken),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })
})
