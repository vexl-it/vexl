import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  ClubAlreadyExistsError,
  InvalidAdminTokenError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Result, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

describe('Create club', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`DELETE FROM club_invitation_link`
        yield* sql`DELETE FROM club_member`
        yield* sql`DELETE FROM club`
      })
    )
  })

  it('Should return 403 when bad admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }
        const errorResponse = yield* pipe(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': 'aha'},
            payload: {
              club: clubData,
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should not accept legacy admin token URL params', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }
        const errorResponse = yield* pipe(
          app.ClubsAdmin.createClub({
            // @ts-expect-error Legacy URL admin-token transport is unsupported.
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              club: clubData,
            },
          }),
          Effect.result
        )

        expect(Result.isFailure(errorResponse)).toBe(true)
      })
    )
  })

  it('Should create a club in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const createdClub = yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: clubData,
          },
        })

        expect(createdClub.clubInfo).toMatchObject(clubData)

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const clubsInDb = yield* app.ClubsAdmin.listClubs({
          headers: {'x-admin-token': ADMIN_TOKEN},
        })

        expect(clubsInDb.clubs).toHaveLength(1)
        expect(clubsInDb.clubs[0]).toMatchObject(clubData)
      })
    )
  })

  it('Should retrun 404 if club already exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: clubData,
          },
        })

        const errorResponse = yield* pipe(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              club: clubData,
            },
          }),
          Effect.result
        )

        expectErrorResponse(ClubAlreadyExistsError)(errorResponse)
      })
    )
  })
})
