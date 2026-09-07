import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {checkForInactiveUsers} from '../../../internalServer/routes/checkForInactiveUsers'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

describe('Check for inactive club members', () => {
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

  it('counts removed inactive members as left for each club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const firstClubUuid = generateClubUuid()
        const secondClubUuid = generateClubUuid()
        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: {
              uuid: firstClubUuid,
              name: 'Alpha',
              description: Option.none(),
              membersCountLimit: 100,
              clubImageUrl: SOME_URL,
              validUntil,
              reportLimit: 10,
            },
          },
        })
        yield* app.ClubsAdmin.createClub({
          headers: {'x-admin-token': ADMIN_TOKEN},
          payload: {
            club: {
              uuid: secondClubUuid,
              name: 'Beta',
              description: Option.none(),
              membersCountLimit: 100,
              clubImageUrl: SOME_URL,
              validUntil,
              reportLimit: 10,
            },
          },
        })

        const clubsDb = yield* ClubsDbService
        const firstClub = yield* pipe(
          clubsDb.findClubByUuid({uuid: firstClubUuid}),
          Effect.flatMap(Effect.fromOption)
        )
        const secondClub = yield* pipe(
          clubsDb.findClubByUuid({uuid: secondClubUuid}),
          Effect.flatMap(Effect.fromOption)
        )
        const membersDb = yield* ClubMembersDbService
        const inactiveAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
        const activeAt = new Date()

        yield* pipe(
          [
            {clubId: firstClub.id, lastRefreshedAt: inactiveAt},
            {clubId: firstClub.id, lastRefreshedAt: inactiveAt},
            {clubId: firstClub.id, lastRefreshedAt: activeAt},
            {clubId: secondClub.id, lastRefreshedAt: inactiveAt},
          ],
          Array.map(({clubId, lastRefreshedAt}) => {
            const key = generatePrivateKey()
            return membersDb.insertClubMember({
              clubId,
              publicKey: key.publicKeyPemBase64,
              publicKeyV2: null,
              notificationToken: null,
              vexlNotificationToken: null,
              lastRefreshedAt,
              isModerator: false,
            })
          }),
          Effect.all
        )

        yield* checkForInactiveUsers

        const result = yield* app.ClubsAdmin.listClubs({
          headers: {'x-admin-token': ADMIN_TOKEN},
        })
        expect(result.clubs).toEqual([
          expect.objectContaining({
            uuid: firstClubUuid,
            membersCount: 1,
            membersLeftLast30Days: 2,
          }),
          expect.objectContaining({
            uuid: secondClubUuid,
            membersCount: 0,
            membersLeftLast30Days: 1,
          }),
        ])
      })
    )
  })
})
