import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {deactivateAndClearClubs} from '../../../internalServer/routes/deactivateAndClearClubs'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

describe('Deactivate and clear clubs', () => {
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

  it('Stores EXPIRED when a club is both expired and over its report limit', async () => {
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
                reportLimit: 1,
              },
            },
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE club
          SET
            report = report_limit
          WHERE
            UUID = ${clubUuid}
        `)

        yield* _(deactivateAndClearClubs)

        const clubs = yield* _(sql`
          SELECT
            made_inactive_reason
          FROM
            club
          WHERE
            UUID = ${clubUuid}
        `)

        expect(clubs.at(0)).toHaveProperty('madeInactiveReason', 'EXPIRED')
      })
    )
  })

  it('clears member changes for deleted clubs and keeps active club history', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const removableClubUuid = generateClubUuid()
        const activeClubUuid = generateClubUuid()
        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)

        yield* _(addTestHeaders({'x-admin-token': ADMIN_TOKEN}))
        yield* _(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              club: {
                uuid: removableClubUuid,
                name: 'Removable club',
                description: Option.none(),
                membersCountLimit: 100,
                clubImageUrl: SOME_URL,
                validUntil,
                reportLimit: 10,
              },
            },
          })
        )
        yield* _(
          app.ClubsAdmin.createClub({
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              club: {
                uuid: activeClubUuid,
                name: 'Active club',
                description: Option.none(),
                membersCountLimit: 100,
                clubImageUrl: SOME_URL,
                validUntil,
                reportLimit: 10,
              },
            },
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE club
          SET
            made_inactive_at = now() - INTERVAL '8 days',
            made_inactive_reason = 'UNKNOWN'
          WHERE
            UUID = ${removableClubUuid}
        `)
        yield* _(sql`
          INSERT INTO
            club_member_count_change (club_id, DAY, joined_count, left_count)
          SELECT
            id,
            current_date,
            1,
            1
          FROM
            club
          WHERE
            UUID = ${removableClubUuid}
          UNION ALL
          SELECT
            id,
            current_date - 32,
            2,
            2
          FROM
            club
          WHERE
            UUID = ${activeClubUuid}
        `)

        yield* _(deactivateAndClearClubs)

        const remainingClubs = yield* _(sql`
          SELECT
            UUID
          FROM
            club
          WHERE
            UUID = ${removableClubUuid}
        `)
        const remainingChanges = yield* _(sql`
          SELECT
            club_member_count_change.joined_count,
            club_member_count_change.left_count
          FROM
            club_member_count_change
        `)
        expect(remainingClubs).toEqual([])
        expect(remainingChanges).toEqual([{joinedCount: 2, leftCount: 2}])
      })
    )
  })
})
