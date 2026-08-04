import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {InvalidAdminTokenError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {
  addTestHeaders,
  clearTestAuthHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, pipe, Schema, String} from 'effect'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

const clubsToSave = [
  {
    clubImageUrl: SOME_URL,
    name: 'zeta',
    description: Option.some('someDescription'),
    membersCountLimit: 100,
    uuid: generateClubUuid(),
    validUntil: new Date(),
    reportLimit: 10,
  },
  {
    clubImageUrl: SOME_URL,
    name: 'Alpha',
    description: Option.some('someDescription2'),
    membersCountLimit: 104,
    uuid: generateClubUuid(),
    validUntil: new Date(),
    reportLimit: 10,
  },
  {
    clubImageUrl: SOME_URL,
    name: 'middle',
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
        yield* _(sql`DELETE FROM club_member_count_change`)
        yield* _(sql`DELETE FROM club`)

        const app = yield* _(NodeTestingApp)
        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        yield* _(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              club: clubsToSave[0],
            },
          })
        )
        yield* _(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              club: clubsToSave[1],
            },
          })
        )
        yield* _(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              club: clubsToSave[2],
            },
          })
        )
        yield* _(clearTestAuthHeaders)
      })
    )
  })

  it('Should return 403 when bad admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const errorResponse = yield* _(
          app.ClubsAdmin.listClubs({
            headers: {'x-admin-token': 'aha'},
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
        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        const clubs = yield* _(
          app.ClubsAdmin.listClubs({headers: {'x-admin-token': ADMIN_TOKEN}}),
          Effect.map((o) => o.clubs)
        )
        expect(
          pipe(
            clubs,
            Array.map((club) => club.name)
          )
        ).toEqual(['Alpha', 'middle', 'zeta'])
        expect(
          pipe(
            clubs,
            Array.sortBy((a, b) => String.localeCompare(a.uuid)(b.uuid))
          )
        ).toMatchObject(
          Array.sortBy((a, b) => String.localeCompare(a.uuid)(b.uuid))(
            clubsToSave
          )
        )
        expect(clubs).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              report: 0,
              membersCount: 0,
              membersJoinedLast30Days: 0,
              membersLeftLast30Days: 0,
              madeInactiveAt: Option.none(),
              madeInactiveReason: Option.none(),
            }),
          ])
        )
      })
    )
  })

  it('Excludes member changes older than 30 days', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const clubsDb = yield* _(ClubsDbService)
        const clubInDb = yield* _(
          clubsDb.findClubByUuid({uuid: clubsToSave[0].uuid}),
          Effect.flatten
        )
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          INSERT INTO
            club_member_count_change (club_id, DAY, joined_count, left_count)
          VALUES
            (
              ${clubInDb.id},
              current_date,
              2,
              3
            ),
            (
              ${clubInDb.id},
              current_date - 31,
              7,
              8
            )
        `)

        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        const result = yield* _(
          app.ClubsAdmin.listClubs({headers: {'x-admin-token': ADMIN_TOKEN}})
        )
        const clubInfo = yield* _(
          pipe(
            result.clubs,
            Array.findFirst((club) => club.uuid === clubsToSave[0].uuid)
          )
        )

        expect(clubInfo.membersJoinedLast30Days).toBe(2)
        expect(clubInfo.membersLeftLast30Days).toBe(3)
      })
    )
  })
})
