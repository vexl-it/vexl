import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  ClubAlreadyExistsError,
  InvalidAdminTokenError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')

describe('Create club', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM club_invitation_link`)
        yield* _(sql`DELETE FROM club_member`)
        yield* _(sql`DELETE FROM club`)
      })
    )
  })

  it('Should return 403 when bad admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }
        const errorResponse = yield* _(
          app.createClub({
            query: {
              adminToken: 'aha',
            },
            body: {
              club: clubData,
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should create a club in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }

        const createdClub = yield* _(
          app.createClub(
            {
              query: {
                adminToken: ADMIN_TOKEN,
              },
              body: {
                club: clubData,
              },
            },
            HttpClientRequest.setHeaders({adminToken: ADMIN_TOKEN})
          )
        )

        expect(createdClub.clubInfo).toMatchObject(clubData)

        const clubsInDb = yield* _(
          app.listClubs(
            {
              query: {
                adminToken: ADMIN_TOKEN,
              },
            },
            HttpClientRequest.setHeaders({adminToken: ADMIN_TOKEN})
          )
        )

        expect(clubsInDb.clubs).toHaveLength(1)
        expect(clubsInDb.clubs[0]).toMatchObject(clubData)
      })
    )
  })

  it('Should retrun 404 if club already exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }

        yield* _(
          app.createClub(
            {
              query: {
                adminToken: ADMIN_TOKEN,
              },
              body: {
                club: clubData,
              },
            },
            HttpClientRequest.setHeaders({adminToken: ADMIN_TOKEN})
          )
        )

        const errorResponse = yield* _(
          app.createClub(
            {
              query: {
                adminToken: ADMIN_TOKEN,
              },
              body: {
                club: clubData,
              },
            },
            HttpClientRequest.setHeaders({adminToken: ADMIN_TOKEN})
          ),
          Effect.either
        )

        expectErrorResponse(ClubAlreadyExistsError)(errorResponse)
      })
    )
  })
})
