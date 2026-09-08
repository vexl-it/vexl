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

describe('Generate club invite link', () => {
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
        const errorResponse = yield* pipe(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            headers: {'x-admin-token': 'aha'},
            payload: {
              clubUuid: clubsToSave[0].uuid,
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should create invite link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const forClub = clubsToSave[0].uuid
        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const inviteLink = yield* app.ClubsAdmin.generateClubInviteLinkForAdmin(
          {
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              clubUuid: forClub,
            },
          }
        )
        expect(inviteLink.clubUuid).toEqual(forClub)
        expect(inviteLink.link.code).toHaveLength(6)
      })
    )
  })

  it('Should return 404 when club does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const forClub = generateClubUuid()
        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const errorResponse = yield* pipe(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              clubUuid: forClub,
            },
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
