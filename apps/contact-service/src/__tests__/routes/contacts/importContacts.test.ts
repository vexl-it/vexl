import {SqlClient} from '@effect/sql'
import {
  ImportContactsQuotaReachedError,
  InitialImportContactsQuotaReachedError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {mockedReportContactsImported} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, LogLevel, Logger, Order, pipe} from 'effect'
import {isArray} from 'effect/Array'
import {
  ImportContactsQuotaRecord,
  createQuotaRecordKey,
} from '../../../routes/contacts/importContactsQuotaService'
import {sendNotificationsMock} from '../../utils/mockedExpoNotificationService'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  makeTestCommonAndSecurityHeaders,
  type DummyUser,
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
      yield* _(Effect.sleep(200))
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
            hash_from = ${me.serverHashedNumber}
        `)

        expect(myOldContactsFromDb).toHaveLength(networkOne.length - 1)

        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )
        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: Array.map(myNewContacts, (c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const myContactsFromDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${me.serverHashedNumber}
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
            hash_from = ${me.serverHashedNumber}
        `)

        expect(myOldContactsFromDb).toHaveLength(networkOne.length - 1)

        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )
        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: Array.map(myNewContacts, (c) => c.hashedNumber),
              replace: false,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const myContactsFromDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${me.serverHashedNumber}
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
        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )
        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: Array.map(myNewContacts, (c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const myContactsFromDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${me.serverHashedNumber}
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
        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )
        yield* _(
          app.Contact.importContacts({
            payload: {contacts: [], replace: true},
            headers: commonAndSecurityHeaders,
          })
        )
      })
    )
  })

  it('Initial import should accept number of contacts lower than quota', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733222222'))
        const quotaRecordKey = createQuotaRecordKey(me.serverHashedNumber)

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

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          app.User.createUser({
            payload: {
              firebaseToken: null,
              expoToken: me.notificationToken,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const response = yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImport.map((c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
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
        const quotaRecordKey = createQuotaRecordKey(me.serverHashedNumber)

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

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          app.User.createUser({
            headers: commonAndSecurityHeaders,
            payload: {
              firebaseToken: null,
              expoToken: me.notificationToken,
            },
          })
        )

        const response = yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImport.map((c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(InitialImportContactsQuotaReachedError)(response)
      })
    )
  })

  it('Should be able to add amount of contacts specified in quota after initial import is done', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733333333'))
        const quotaRecordKey = createQuotaRecordKey(me.serverHashedNumber)
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

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          app.User.createUser({
            headers: commonAndSecurityHeaders,
            payload: {
              firebaseToken: null,
              expoToken: me.notificationToken,
            },
          })
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
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImport.map((c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
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
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImportAfterInitialImport.map(
                (c) => c.hashedNumber
              ),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
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
          app.Contact.importContacts({
            payload: {
              contacts: moreContactsToImportThatExceedQuota.map(
                (c) => c.hashedNumber
              ),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(ImportContactsQuotaReachedError)(failedResponse)
      })
    )
  })

  it('Should not increase limit and meet quota when importing the same phone numbers again', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733444444'))
        const quotaRecordKey = createQuotaRecordKey(me.serverHashedNumber)

        yield* _(redis.set(ImportContactsQuotaRecord)(quotaRecordKey, 0))

        const contactsToImport = yield* _(
          Effect.all([generateKeysAndHasheForNumber('+420733333006')])
        )
        const app = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          app.User.createUser({
            payload: {
              firebaseToken: null,
              expoToken: me.notificationToken,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const response = yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImport.map((c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
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
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImportAfterInitialImport.map(
                (c) => c.hashedNumber
              ),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expect(successResponse._tag).toEqual('Right')

        const secondSuccessResponse = yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImportAfterInitialImport.map(
                (c) => c.hashedNumber
              ),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expect(secondSuccessResponse._tag).toEqual('Right')
      })
    )
  })

  it('Should return proper phoneNumberHashesToServerClientHash lookup table', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const redis = yield* _(RedisService)
        const me = yield* _(generateKeysAndHasheForNumber('+420733111111'))
        const quotaRecordKey = createQuotaRecordKey(me.serverHashedNumber)

        yield* _(redis.set(ImportContactsQuotaRecord)(quotaRecordKey, 0))

        const contactsToImport = yield* _(
          Effect.all([
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
            generateKeysAndHasheForNumber('+420733333016'),
            generateKeysAndHasheForNumber('+420733333017'),
          ])
        )
        const app = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          app.User.createUser({
            headers: commonAndSecurityHeaders,
            payload: {
              firebaseToken: null,
              expoToken: me.notificationToken,
            },
          })
        )

        const response = yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: contactsToImport.map((c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const expectedLookupTable = pipe(
          contactsToImport,
          Array.map((c) => ({
            hashedNumber: c.hashedNumber,
            serverToClientHash: c.serverHashedNumberForClient,
          }))
        )

        expect(response.phoneNumberHashesToServerToClientHash).toEqual(
          expectedLookupTable
        )
      })
    )
  })
})

describe('Notification', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(Effect.sleep(400))
        sendNotificationsMock.mockClear()
      })
    )
  })

  it('Notifies other users about new user', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]

        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          app.Contact.importContacts({
            payload: {contacts: [], replace: true},
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(Effect.sleep(200))
        expect(sendNotificationsMock).not.toHaveBeenCalled()

        sendNotificationsMock.mockClear()

        const contactsToImport = Array.filter(
          [...networkOne],
          (one) => one.hashedNumber !== me.hashedNumber
        )

        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: Array.map(contactsToImport, (c) => c.hashedNumber),
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(Effect.sleep(200))

        const call = sendNotificationsMock.mock.calls[0][0]

        expect(
          pipe(
            call.map((one) => (isArray(one.to) ? one.to : [one.to])),
            Array.flatten,
            Array.sort(Order.string),
            Array.join(',')
          )
        ).toBe(
          pipe(
            [...networkOne, ...networkTwo],
            Array.filter(
              (one) => one.notificationToken !== me.notificationToken
            ),
            Array.map((c) => c.notificationToken),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })
})
