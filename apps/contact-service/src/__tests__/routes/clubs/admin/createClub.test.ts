import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {ClubAlreadyExistsError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingInternalApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

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

  it('Should create a club in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)

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
          internalApp.ClubsAdmin.createClub({
            payload: {
              club: clubData,
            },
          })
        )

        expect(createdClub.clubInfo).toMatchObject(clubData)

        const clubsInDb = yield* _(internalApp.ClubsAdmin.listClubs({}))

        expect(clubsInDb.clubs).toHaveLength(1)
        expect(clubsInDb.clubs[0]).toMatchObject(clubData)
      })
    )
  })

  it('Should retrun 404 if club already exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)

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
          internalApp.ClubsAdmin.createClub({
            payload: {
              club: clubData,
            },
          })
        )

        const errorResponse = yield* _(
          internalApp.ClubsAdmin.createClub({
            payload: {
              club: clubData,
            },
          }),
          Effect.either
        )

        expectErrorResponse(ClubAlreadyExistsError)(errorResponse)
      })
    )
  })
})
