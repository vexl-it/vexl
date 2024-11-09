import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ImportContactsQuotaReachedError,
  InitialImportContactsQuotaReachedError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {mockedReportContactsImported} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {
  Array,
  Effect,
  Either,
  Logger,
  LogLevel,
  Order,
  pipe,
  Schema,
} from 'effect'
import {
  createQuotaRecordKey,
  ImportContactsQuotaRecord,
} from '../../../../routes/contacts/importContactsQuotaService'
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

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM user_contact`)
      yield* _(sql`DELETE FROM users`)
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
              body: {
                contacts: Array.map(myNewContacts, (c) => c.hashedNumber),
                replace: true,
              },
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

  it('Imports contacts to the database and does not replace the existing contacts when replace is false', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const myNewContacts = networkTwo.slice(1, 3)

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
              body: {
                contacts: Array.map(myNewContacts, (c) => c.hashedNumber),
                replace: false,
              },
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

        expect(myContactsFromDb).toHaveLength(
          myNewContacts.length + myOldContactsFromDb.length
        )
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
              body: {
                contacts: Array.map(myNewContacts, (c) => c.hashedNumber),
                replace: true,
              },
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
              body: {contacts: [], replace: true},
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )
      })
    )
  })

  it('Initial import should accept number of contacts lower than quota', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733222222'))
        const quotaRecordKey = createQuotaRecordKey(me.hashedNumber)

        yield* _(redis.set(ImportContactsQuotaRecord)(quotaRecordKey, 0))

        const contactsToImport = yield* _(
          Effect.all([
            // 0
            generateKeysAndHasheForNumber('+420733333006'),
            generateKeysAndHasheForNumber('+420733333007'),
            generateKeysAndHasheForNumber('+420733333008'),
            generateKeysAndHasheForNumber('+420733333009'),
            generateKeysAndHasheForNumber('+420733333010'),
            generateKeysAndHasheForNumber('+420733333011'),
            generateKeysAndHasheForNumber('+420733333012'),
            generateKeysAndHasheForNumber('+420733333013'),
            generateKeysAndHasheForNumber('+420733333014'),
            generateKeysAndHasheForNumber('+420733333015'),
            // 10
            generateKeysAndHasheForNumber('+420733333016'),
            generateKeysAndHasheForNumber('+420733333017'),
            generateKeysAndHasheForNumber('+420733333018'),
            generateKeysAndHasheForNumber('+420733333019'),
            generateKeysAndHasheForNumber('+420733333020'),
            generateKeysAndHasheForNumber('+420733333021'),
            generateKeysAndHasheForNumber('+420733333022'),
            generateKeysAndHasheForNumber('+420733333023'),
            generateKeysAndHasheForNumber('+420733333024'),
            generateKeysAndHasheForNumber('+420733333025'),
          ])
        )
        const app = yield* _(NodeTestingApp)

        const commonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
        })

        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: me.firebaseToken,
              },
              headers: commonHeaders,
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const response = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImport.map((c) => c.hashedNumber),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(response._tag).toEqual('Right')
      })
    )
  })

  it('Initial import for new user should not accept more contacts than specified in initial import quota', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733111111'))
        const quotaRecordKey = createQuotaRecordKey(me.hashedNumber)

        yield* _(redis.set(ImportContactsQuotaRecord)(quotaRecordKey, 0))

        const contactsToImport = yield* _(
          Effect.all([
            // 0
            generateKeysAndHasheForNumber('+420733333006'),
            generateKeysAndHasheForNumber('+420733333007'),
            generateKeysAndHasheForNumber('+420733333008'),
            generateKeysAndHasheForNumber('+420733333009'),
            generateKeysAndHasheForNumber('+420733333010'),
            generateKeysAndHasheForNumber('+420733333011'),
            generateKeysAndHasheForNumber('+420733333012'),
            generateKeysAndHasheForNumber('+420733333013'),
            generateKeysAndHasheForNumber('+420733333014'),
            generateKeysAndHasheForNumber('+420733333015'),
            // 10
            generateKeysAndHasheForNumber('+420733333016'),
            generateKeysAndHasheForNumber('+420733333017'),
            generateKeysAndHasheForNumber('+420733333018'),
            generateKeysAndHasheForNumber('+420733333019'),
            generateKeysAndHasheForNumber('+420733333020'),
            generateKeysAndHasheForNumber('+420733333021'),
            generateKeysAndHasheForNumber('+420733333022'),
            generateKeysAndHasheForNumber('+420733333023'),
            generateKeysAndHasheForNumber('+420733333024'),
            generateKeysAndHasheForNumber('+420733333025'),
            // 20
            generateKeysAndHasheForNumber('+420733333026'),
          ])
        )
        const app = yield* _(NodeTestingApp)

        const commonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
        })

        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: me.firebaseToken,
              },
              headers: commonHeaders,
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const response = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImport.map((c) => c.hashedNumber),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(response._tag).toEqual('Left')
        if (!Either.isLeft(response)) return
        expect(
          Schema.decodeUnknownEither(InitialImportContactsQuotaReachedError)(
            response.left.error
          )._tag
        ).toEqual('Right')
      })
    )
  })

  it('Should be able to add amount of contacts specified in quota after initial import is done', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733333333'))
        const quotaRecordKey = createQuotaRecordKey(me.hashedNumber)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(redis.set(ImportContactsQuotaRecord)(quotaRecordKey, 0))

        const contactsToImport = yield* _(
          Effect.all([
            // 0
            generateKeysAndHasheForNumber('+420733333006'),
            generateKeysAndHasheForNumber('+420733333007'),
            generateKeysAndHasheForNumber('+420733333008'),
            generateKeysAndHasheForNumber('+420733333009'),
            generateKeysAndHasheForNumber('+420733333010'),
            generateKeysAndHasheForNumber('+420733333011'),
            generateKeysAndHasheForNumber('+420733333012'),
            generateKeysAndHasheForNumber('+420733333013'),
            generateKeysAndHasheForNumber('+420733333014'),
            generateKeysAndHasheForNumber('+420733333015'),
            // 10
            generateKeysAndHasheForNumber('+420733333016'),
            generateKeysAndHasheForNumber('+420733333017'),
            generateKeysAndHasheForNumber('+420733333018'),
            generateKeysAndHasheForNumber('+420733333019'),
            generateKeysAndHasheForNumber('+420733333020'),
            generateKeysAndHasheForNumber('+420733333021'),
            generateKeysAndHasheForNumber('+420733333022'),
            generateKeysAndHasheForNumber('+420733333023'),
            generateKeysAndHasheForNumber('+420733333024'),
            generateKeysAndHasheForNumber('+420733333025'),
          ])
        )
        const app = yield* _(NodeTestingApp)

        const commonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
        })

        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: me.firebaseToken,
              },
              headers: commonHeaders,
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const initialImportDoneDefaultValue = yield* _(sql`
          SELECT
            initial_import_done
          FROM
            users
          WHERE
            public_key = ${me.authHeaders['public-key']}
        `)

        expect(initialImportDoneDefaultValue[0]).toHaveProperty(
          'initialImportDone',
          false
        )

        const response = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImport.map((c) => c.hashedNumber),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(response._tag).toEqual('Right')

        const updatedImportDoneValue = yield* _(sql`
          SELECT
            initial_import_done
          FROM
            users
          WHERE
            public_key = ${me.authHeaders['public-key']}
        `)

        expect(updatedImportDoneValue[0]).toHaveProperty(
          'initialImportDone',
          true
        )

        const contactsToImportAfterInitialImport = yield* _(
          Effect.all([
            generateKeysAndHasheForNumber('+420733333027'),
            generateKeysAndHasheForNumber('+420733333028'),
            generateKeysAndHasheForNumber('+420733333029'),
            generateKeysAndHasheForNumber('+420733333030'),
            generateKeysAndHasheForNumber('+420733333031'),
            generateKeysAndHasheForNumber('+420733333032'),
            generateKeysAndHasheForNumber('+420733333033'),
            generateKeysAndHasheForNumber('+420733333034'),
            generateKeysAndHasheForNumber('+420733333035'),
            generateKeysAndHasheForNumber('+420733333036'),
          ])
        )

        const successResponse = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImportAfterInitialImport.map(
                  (c) => c.hashedNumber
                ),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(successResponse._tag).toEqual('Right')

        const moreContactsToImportThatExceedQuota = yield* _(
          Effect.all([
            // 0
            generateKeysAndHasheForNumber('+420733333037'),
            generateKeysAndHasheForNumber('+420733333038'),
            generateKeysAndHasheForNumber('+420733333039'),
            generateKeysAndHasheForNumber('+420733333040'),
            generateKeysAndHasheForNumber('+420733333041'),
          ])
        )

        const failedResponse = yield* _(
          app.importContacts(
            {
              body: {
                contacts: moreContactsToImportThatExceedQuota.map(
                  (c) => c.hashedNumber
                ),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(failedResponse._tag).toEqual('Left')
        if (!Either.isLeft(failedResponse)) return
        expect(
          Schema.decodeUnknownEither(ImportContactsQuotaReachedError)(
            failedResponse.left.error
          )._tag
        ).toEqual('Right')
      })
    )
  })

  it('Should not increase limit and meet quota when importing the same phone numbers again', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733444444'))
        const quotaRecordKey = createQuotaRecordKey(me.hashedNumber)

        yield* _(redis.set(ImportContactsQuotaRecord)(quotaRecordKey, 0))

        const contactsToImport = yield* _(
          Effect.all([generateKeysAndHasheForNumber('+420733333006')])
        )
        const app = yield* _(NodeTestingApp)

        const commonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
        })

        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: me.firebaseToken,
              },
              headers: commonHeaders,
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const response = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImport.map((c) => c.hashedNumber),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(response._tag).toEqual('Right')

        const contactsToImportAfterInitialImport = yield* _(
          Effect.all([
            generateKeysAndHasheForNumber('+420733333027'),
            generateKeysAndHasheForNumber('+420733333028'),
            generateKeysAndHasheForNumber('+420733333029'),
            generateKeysAndHasheForNumber('+420733333030'),
            generateKeysAndHasheForNumber('+420733333031'),
            generateKeysAndHasheForNumber('+420733333032'),
            generateKeysAndHasheForNumber('+420733333033'),
            generateKeysAndHasheForNumber('+420733333034'),
            generateKeysAndHasheForNumber('+420733333035'),
            generateKeysAndHasheForNumber('+420733333036'),
          ])
        )

        const successResponse = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImportAfterInitialImport.map(
                  (c) => c.hashedNumber
                ),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(successResponse._tag).toEqual('Right')

        const secondSuccessResponse = yield* _(
          app.importContacts(
            {
              body: {
                contacts: contactsToImportAfterInitialImport.map(
                  (c) => c.hashedNumber
                ),
                replace: true,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
          Effect.either
        )

        expect(secondSuccessResponse._tag).toEqual('Right')
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
              body: {contacts: [], replace: true},
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
                replace: true,
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
