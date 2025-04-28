import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {InvalidAdminTokenError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
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
describe('Modify club', () => {
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

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someName',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: clubsToSave[0].uuid,
          validUntil: new Date(),
          reportLimit: 10,
        }
        const errorResponse = yield* _(
          app.modifyClub({
            query: {
              adminToken: 'aha',
            },
            body: {
              clubInfo: clubData,
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should modify a club in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someNewName',
          description: Option.some('someNewName'),
          membersCountLimit: 200,
          uuid: clubsToSave[0].uuid,
          validUntil: new Date(),
          reportLimit: 10,
        }

        const modifiedClub = yield* _(
          app.modifyClub(
            {
              query: {
                adminToken: ADMIN_TOKEN,
              },
              body: {
                clubInfo: clubData,
              },
            },
            HttpClientRequest.setHeaders({adminToken: ADMIN_TOKEN})
          )
        )

        expect(modifiedClub.clubInfo).toMatchObject(clubData)

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

        expect(clubsInDb.clubs).toHaveLength(3)
        expect(
          clubsInDb.clubs.find((one) => one.uuid === clubData.uuid)
        ).toMatchObject(clubData)
      })
    )
  })

  it('Should retrun 404 if club does not exist', async () => {
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
          app.modifyClub(
            {
              query: {
                adminToken: ADMIN_TOKEN,
              },
              body: {
                clubInfo: clubData,
              },
            },
            HttpClientRequest.setHeaders({adminToken: ADMIN_TOKEN})
          ),
          Effect.either
        )

        if (errorResponse._tag !== 'Left') {
          throw new Error('Expected error response')
        }
        expect((errorResponse.left as any).status).toEqual(404)
      })
    )
  })
})
