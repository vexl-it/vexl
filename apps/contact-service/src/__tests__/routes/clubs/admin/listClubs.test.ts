import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {InvalidAdminTokenError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Array, Effect, Option, Schema, String} from 'effect'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')

const clubsToSave = [
  {
    clubImageUrl: SOME_URL,
    name: 'someName',
    description: Option.some('someDescription'),
    membersCountLimit: 100,
    uuid: generateClubUuid(),
    validUntil: new Date(),
    reportLimit: 10,
  },
  {
    clubImageUrl: SOME_URL,
    name: 'someName2',
    description: Option.some('someDescription2'),
    membersCountLimit: 104,
    uuid: generateClubUuid(),
    validUntil: new Date(),
    reportLimit: 10,
  },
  {
    clubImageUrl: SOME_URL,
    name: 'someName3',
    description: Option.some('someDescription3'),
    membersCountLimit: 1003,
    uuid: generateClubUuid(),
    validUntil: new Date(),
    reportLimit: 10,
  },
]

describe('List clubs', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM club_invitation_link`)
        yield* _(sql`DELETE FROM club_member`)
        yield* _(sql`DELETE FROM club`)

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.createClub({
            body: {
              club: clubsToSave[0],
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )
        yield* _(
          app.createClub({
            body: {
              club: clubsToSave[1],
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )
        yield* _(
          app.createClub({
            body: {
              club: clubsToSave[2],
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )
      })
    )
  })

  it('Should return 403 when bad admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const errorResponse = yield* _(
          app.listClubs({
            query: {
              adminToken: 'aha',
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should return all clubs in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const clubs = yield* _(
          app.listClubs({query: {adminToken: ADMIN_TOKEN}}),
          Effect.map((o) => o.clubs),
          Effect.map(
            Array.sortBy((a, b) => String.localeCompare(a.uuid)(b.uuid))
          )
        )
        expect(clubs).toMatchObject(
          Array.sortBy((a, b) => String.localeCompare(a.uuid)(b.uuid))(
            clubsToSave
          )
        )
      })
    )
  })
})
