import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

describe('Get club stats', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`DELETE FROM club_invitation_link`
        yield* sql`DELETE FROM club_member`
        yield* sql`DELETE FROM club_member_count_change`
        yield* sql`DELETE FROM club`
      })
    )
  })

  it('returns current member count and the last 366 days of ordered changes', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const clubUuid = generateClubUuid()

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: {
              uuid: clubUuid,
              name: 'Stats club',
              description: Option.none(),
              membersCountLimit: 100,
              clubImageUrl: SOME_URL,
              validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
              reportLimit: 10,
            },
          },
        })

        const sql = yield* SqlClient.SqlClient
        yield* sql`
          INSERT INTO
            club_member (
              club_id,
              public_key,
              public_key_v2,
              notification_token,
              vexl_notification_token,
              last_refreshed_at,
              is_moderator
            )
          SELECT
            club.id,
            member.public_key,
            NULL,
            NULL,
            NULL,
            now(),
            FALSE
          FROM
            club
            CROSS JOIN (
              VALUES
                ('stats-member-1'),
                ('stats-member-2')
            ) AS member (public_key)
          WHERE
            club.uuid = ${clubUuid}
        `
        yield* sql`
          INSERT INTO
            club_member_count_change (club_id, DAY, joined_count, left_count)
          SELECT
            club.id,
            change.day,
            change.joined_count,
            change.left_count
          FROM
            club
            CROSS JOIN (
              VALUES
                (current_date - 5, 2, 1),
                (current_date - 366, 3, 4),
                (current_date, 5, 6),
                (current_date - 367, 7, 8)
            ) AS change (DAY, joined_count, left_count)
          WHERE
            club.uuid = ${clubUuid}
        `

        const response = yield* app.ClubsAdmin.getClubStats({
          headers: {'x-admin-token': ADMIN_TOKEN},
          query: {clubUuid},
        })

        expect(response).toEqual({
          membersCount: 2,
          changes: [
            {day: expect.any(Date), joinedCount: 3, leftCount: 4},
            {day: expect.any(Date), joinedCount: 2, leftCount: 1},
            {day: expect.any(Date), joinedCount: 5, leftCount: 6},
          ],
        })
      })
    )
  })

  it('returns not found for an unknown club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const errorResponse = yield* pipe(
          app.ClubsAdmin.getClubStats({
            headers: {'x-admin-token': ADMIN_TOKEN},
            query: {clubUuid: generateClubUuid()},
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
