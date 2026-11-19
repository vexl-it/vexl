import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {clearTestAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingInternalApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

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
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM club_invitation_link`)
        yield* _(sql`DELETE FROM club_member`)
        yield* _(sql`DELETE FROM club`)

        const internalApp = yield* _(NodeTestingInternalApp)
        yield* _(
          internalApp.ClubsAdmin.createClub({
            payload: {
              club: clubsToSave[0],
            },
          })
        )
        yield* _(
          internalApp.ClubsAdmin.createClub({
            payload: {
              club: clubsToSave[1],
            },
          })
        )
        yield* _(
          internalApp.ClubsAdmin.createClub({
            payload: {
              club: clubsToSave[2],
            },
          })
        )
        yield* _(clearTestAuthHeaders)
      })
    )
  })

  it('Should create invite link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const forClub = clubsToSave[0].uuid
        const inviteLink = yield* _(
          internalApp.ClubsAdmin.generateClubInviteLinkForAdmin({
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
        const internalApp = yield* _(NodeTestingInternalApp)
        const forClub = generateClubUuid()
        const errorResponse = yield* _(
          internalApp.ClubsAdmin.generateClubInviteLinkForAdmin({
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
