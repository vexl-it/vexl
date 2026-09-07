import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {InvalidAdminTokenError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {
  addTestHeaders,
  clearTestAuthHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

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
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`DELETE FROM club_invitation_link`
        yield* sql`DELETE FROM club_member`
        yield* sql`DELETE FROM club`

        const app = yield* NodeTestingApp
        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: clubsToSave[0],
          },
        })
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: clubsToSave[1],
          },
        })
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: clubsToSave[2],
          },
        })
        yield* clearTestAuthHeaders
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
          uuid: clubsToSave[0].uuid,
          validUntil: new Date(),
          reportLimit: 10,
        }
        const errorResponse = yield* pipe(
          app.ClubsAdmin.modifyClub({
            headers: {'x-admin-token': 'aha'},
            payload: {
              clubInfo: clubData,
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should modify a club in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const clubData = {
          clubImageUrl: SOME_URL,
          name: 'someNewName',
          description: Option.some('someNewName'),
          membersCountLimit: 200,
          uuid: clubsToSave[0].uuid,
          validUntil: new Date(),
          reportLimit: 10,
        }

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const modifiedClub = yield* app.ClubsAdmin.modifyClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            clubInfo: clubData,
          },
        })

        expect(modifiedClub.clubInfo).toMatchObject(clubData)

        const clubsInDb = yield* app.ClubsAdmin.listClubs({
          headers: {'x-admin-token': ADMIN_TOKEN},
        })

        expect(clubsInDb.clubs).toHaveLength(3)
        expect(
          clubsInDb.clubs.find((one) => one.uuid === clubData.uuid)
        ).toMatchObject(clubData)
      })
    )
  })

  it('Should retrun 404 if club does not exist', async () => {
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
        const errorResponse = yield* pipe(
          app.ClubsAdmin.modifyClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              clubInfo: clubData,
            },
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
