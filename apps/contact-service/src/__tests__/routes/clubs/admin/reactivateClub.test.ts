import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {ClubCannotBeReactivatedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Either, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

describe('Reactivate club', () => {
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

  it('Reactivates an eligible inactive club', async () => {
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
                name: 'Inactive club',
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
          UPDATE club
          SET
            made_inactive_at = now(),
            made_inactive_reason = 'FLAGGED'
          WHERE
            UUID = ${clubUuid}
        `)
        yield* _(sql`
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
            id,
            'reactivate-test-key',
            NULL,
            NULL,
            NULL,
            now(),
            FALSE
          FROM
            club
          WHERE
            UUID = ${clubUuid}
        `)
        yield* _(sql`
          INSERT INTO
            club_member_count_change (club_id, DAY, joined_count, left_count)
          SELECT
            id,
            current_date,
            2,
            3
          FROM
            club
          WHERE
            UUID = ${clubUuid}
        `)

        const response = yield* _(
          app.ClubsAdmin.reactivateClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {clubUuid},
          })
        )

        expect(response.clubInfo.madeInactiveAt).toEqual(Option.none())
        expect(response.clubInfo.madeInactiveReason).toEqual(Option.none())
        expect(response.clubInfo).toMatchObject({
          membersCount: 1,
          membersJoinedLast30Days: 2,
          membersLeftLast30Days: 3,
        })
      })
    )
  })

  it('Rejects a club past its validity date', async () => {
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
                name: 'Expired club',
                description: Option.none(),
                membersCountLimit: 100,
                clubImageUrl: SOME_URL,
                validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
                reportLimit: 10,
              },
            },
          })
        )

        const errorResponse = yield* _(
          app.ClubsAdmin.reactivateClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {clubUuid},
          }),
          Effect.either
        )

        expectErrorResponse(ClubCannotBeReactivatedError)(errorResponse)
        if (Either.isLeft(errorResponse)) {
          expect(errorResponse.left).toHaveProperty(
            'reactivationBlockedReason',
            'PAST_VALIDITY'
          )
        }
      })
    )
  })

  it('Rejects a club whose report count reached its limit', async () => {
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
                name: 'Flagged club',
                description: Option.none(),
                membersCountLimit: 100,
                clubImageUrl: SOME_URL,
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
                reportLimit: 1,
              },
            },
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE club
          SET
            report = report_limit,
            made_inactive_at = now(),
            made_inactive_reason = 'FLAGGED'
          WHERE
            UUID = ${clubUuid}
        `)

        const errorResponse = yield* _(
          app.ClubsAdmin.reactivateClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {clubUuid},
          }),
          Effect.either
        )

        expectErrorResponse(ClubCannotBeReactivatedError)(errorResponse)
        if (Either.isLeft(errorResponse)) {
          expect(errorResponse.left).toHaveProperty(
            'reactivationBlockedReason',
            'REPORT_LIMIT_REACHED'
          )
        }
      })
    )
  })

  it('Returns not found for an unknown club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        const errorResponse = yield* _(
          app.ClubsAdmin.reactivateClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {clubUuid: generateClubUuid()},
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
