import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

describe('Get club stats', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM club_invitation_link`)
        yield* _(sql`DELETE FROM club_member`)
        yield* _(sql`DELETE FROM club_member_count_change`)
        yield* _(sql`DELETE FROM club`)
      })
    )
  })

  it('returns current member count and the last 366 days of ordered changes', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const clubUuid = generateClubUuid()

        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        yield* _(
          app.ClubsAdmin.createClub({
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
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          INSERT INTO
            club_member (
              club_id,
              public_key,
              public_key_v2,
              vexl_notification_token,
              last_refreshed_at,
              is_moderator
            )
          SELECT
            club.id,
            member.public_key,
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
        `)
        yield* _(sql`
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
        `)

        const response = yield* _(
          app.ClubsAdmin.getClubStats({
            headers: {'x-admin-token': ADMIN_TOKEN},
            urlParams: {clubUuid},
          })
        )

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
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        const errorResponse = yield* _(
          app.ClubsAdmin.getClubStats({
            headers: {'x-admin-token': ADMIN_TOKEN},
            urlParams: {clubUuid: generateClubUuid()},
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
