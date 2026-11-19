import {SqlClient} from '@effect/sql'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {BannedNumbersMonthlyLimitReachedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Array, Effect, Order, pipe, Schema} from 'effect'
import {banNumbers} from '../../utils/bannedNumbers'
import {NodeTestingInternalApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {generateKeysAndHasheForNumber, withEnvVar} from '../contacts/utils'

const numbers = pipe(
  ['+420733444001', '+420733444002', '+420733444003', '+420733444004'],
  Array.map((number) => Schema.decodeSync(E164PhoneNumber)(number))
)

describe('Banned numbers admin', () => {
  it('Stores numbers with the same hash clients import them with', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingInternalApp)
        const bank = yield* _(generateKeysAndHasheForNumber('+420733444101'))

        const result = yield* _(
          app.BannedNumbersAdmin.addBannedNumbers({
            payload: {
              numbers: [{phoneNumber: bank.phoneNumber, note: 'Some bank'}],
            },
          })
        )
        expect(result).toEqual({addedCount: 1, alreadyBannedCount: 0})

        const sql = yield* _(SqlClient.SqlClient)
        const rows = yield* _(sql`
          SELECT
            hash,
            note
          FROM
            banned_number
          WHERE
            phone_number = ${bank.phoneNumber}
        `)
        expect(rows).toEqual([
          {hash: bank.serverHashedNumber, note: 'Some bank'},
        ])
      })
    )
  })

  it('Stores a number written with its national prefix in canonical form', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const helpline = yield* _(generateKeysAndHasheForNumber('+448001111'))

        yield* _(
          banNumbers([Schema.decodeSync(E164PhoneNumber)('+4408001111')])
        )

        const sql = yield* _(SqlClient.SqlClient)
        const rows = yield* _(sql`
          SELECT
            phone_number,
            hash
          FROM
            banned_number
        `)
        expect(rows).toEqual([
          {
            phoneNumber: helpline.phoneNumber,
            hash: helpline.serverHashedNumber,
          },
        ])
      })
    )
  })

  it('Skips numbers that are already banned', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        expect(yield* _(banNumbers([numbers[0], numbers[1]]))).toEqual({
          addedCount: 2,
          alreadyBannedCount: 0,
        })
        expect(
          yield* _(banNumbers([numbers[1], numbers[2], numbers[2]]))
        ).toEqual({addedCount: 1, alreadyBannedCount: 2})

        const sql = yield* _(SqlClient.SqlClient)
        const rows = yield* _(sql`
          SELECT
            phone_number
          FROM
            banned_number
        `)
        expect(rows).toHaveLength(3)
      })
    )
  })

  it('Rejects a batch that would go over the monthly limit', async () => {
    await withEnvVar('BANNED_NUMBERS_MONTHLY_LIMIT', '3', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          yield* _(banNumbers([numbers[0], numbers[1]]))

          const overLimit = yield* _(
            banNumbers([numbers[1], numbers[2], numbers[3]]),
            Effect.either
          )
          expectErrorResponse(BannedNumbersMonthlyLimitReachedError)(overLimit)
          expect(overLimit).toMatchObject({
            left: {monthlyLimit: 3, remainingThisMonth: 1},
          })

          const sql = yield* _(SqlClient.SqlClient)
          const countRows = sql`
            SELECT
              count(*)::int AS count
            FROM
              banned_number
          `
          expect(yield* _(countRows)).toEqual([{count: 2}])

          expect(yield* _(banNumbers([numbers[1], numbers[2]]))).toEqual({
            addedCount: 1,
            alreadyBannedCount: 1,
          })
          expect(yield* _(countRows)).toEqual([{count: 3}])
        })
      )
    })
  })

  it('Accepts a batch of already banned numbers when over the limit', async () => {
    await withEnvVar('BANNED_NUMBERS_MONTHLY_LIMIT', '1', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          yield* _(banNumbers([numbers[0]]))

          const sql = yield* _(SqlClient.SqlClient)
          yield* _(sql`
            INSERT INTO
              banned_number (phone_number, hash)
            VALUES
              (
                '+420733444999',
                'banned before the limit was lowered'
              )
          `)

          expect(yield* _(banNumbers([numbers[0]]))).toEqual({
            addedCount: 0,
            alreadyBannedCount: 1,
          })
        })
      )
    })
  })

  it('Does not count numbers banned in previous months', async () => {
    await withEnvVar('BANNED_NUMBERS_MONTHLY_LIMIT', '2', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          yield* _(banNumbers([numbers[0], numbers[1]]))

          const sql = yield* _(SqlClient.SqlClient)
          yield* _(sql`
            UPDATE banned_number
            SET
              created_at = date_trunc('month', now()) - interval '1 day'
          `)

          expect(yield* _(banNumbers([numbers[2], numbers[3]]))).toEqual({
            addedCount: 2,
            alreadyBannedCount: 0,
          })
        })
      )
    })
  })

  it('Lists numbers newest first, paginated and searchable', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingInternalApp)
        yield* _(banNumbers(numbers))

        const firstPage = yield* _(
          app.BannedNumbersAdmin.listBannedNumbers({
            payload: {limit: 3},
          })
        )
        expect(firstPage.hasNext).toBe(true)
        expect(
          pipe(
            firstPage.items,
            Array.map((one) => one.phoneNumber)
          )
        ).toEqual([numbers[3], numbers[2], numbers[1]])
        expect(
          pipe(Object.keys(firstPage.items[0]), Array.sort(Order.string))
        ).toEqual(['createdAt', 'id', 'note', 'phoneNumber'])

        const secondPage = yield* _(
          app.BannedNumbersAdmin.listBannedNumbers({
            payload: {
              limit: 3,
              nextPageToken: firstPage.nextPageToken ?? undefined,
            },
          })
        )
        expect(secondPage.hasNext).toBe(false)
        expect(
          pipe(
            secondPage.items,
            Array.map((one) => one.phoneNumber)
          )
        ).toEqual([numbers[0]])

        const searched = yield* _(
          app.BannedNumbersAdmin.listBannedNumbers({
            payload: {limit: 10, search: ' 444002 '},
          })
        )
        expect(
          pipe(
            searched.items,
            Array.map((one) => one.phoneNumber)
          )
        ).toEqual([numbers[1]])
      })
    )
  })

  it('Deletes a number by id', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingInternalApp)
        yield* _(banNumbers([numbers[0], numbers[1]]))

        const listAll = app.BannedNumbersAdmin.listBannedNumbers({
          payload: {limit: 10},
        })
        const [newest, oldest] = (yield* _(listAll)).items

        yield* _(
          app.BannedNumbersAdmin.deleteBannedNumber({
            path: {id: newest.id},
          })
        )
        expect((yield* _(listAll)).items).toEqual([oldest])

        expectErrorResponse(NotFoundError)(
          yield* _(
            app.BannedNumbersAdmin.deleteBannedNumber({
              path: {id: newest.id},
            }),
            Effect.either
          )
        )
      })
    )
  })
})
