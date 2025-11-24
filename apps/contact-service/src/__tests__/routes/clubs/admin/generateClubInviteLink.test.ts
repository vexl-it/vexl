import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {InvalidAdminTokenError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
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

describe('Generate club invite link', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM club_invitation_link`)
        yield* _(sql`DELETE FROM club_member`)
        yield* _(sql`DELETE FROM club`)

        const app = yield* _(NodeTestingApp)
        yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
        yield* _(
          app.ClubsAdmin.createClub({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              club: clubsToSave[0],
              adminNote: Option.none(),
            },
          })
        )
        yield* _(
          app.ClubsAdmin.createClub({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              club: clubsToSave[1],
              adminNote: Option.none(),
            },
          })
        )
        yield* _(
          app.ClubsAdmin.createClub({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              club: clubsToSave[2],
              adminNote: Option.none(),
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
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: 'aha',
            },
            payload: {
              clubUuid: clubsToSave[0].uuid,
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidAdminTokenError)(errorResponse)
      })
    )
  })

  it('Should create invite link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClub = clubsToSave[0].uuid
        yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
        const inviteLink = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: forClub,
            },
          })
        )
        expect(inviteLink.clubUuid).toEqual(forClub)
        expect(inviteLink.link.code).toHaveLength(6)
      })
    )
  })

  it('Should return 404 when club does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClub = generateClubUuid()
        yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
        const errorResponse = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: forClub,
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
