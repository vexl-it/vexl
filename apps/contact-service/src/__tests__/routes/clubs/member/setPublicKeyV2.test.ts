import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {addChallengeToRequest2} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {makeTestCommonAndSecurityHeaders} from '../../../routes/contacts/utils'
import {
  type MockedUser,
  createMockedUser,
} from '../../../utils/createMockedUser'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

const memberKeyPair = generatePrivateKey()

let user: MockedUser

const firstClub = {
  clubImageUrl: SOME_URL,
  name: 'firstClub',
  description: Option.some('firstClubDescription'),
  membersCountLimit: 100,
  uuid: generateClubUuid(),
  validUntil: new Date(),
  reportLimit: 10,
}

const secondClub = {
  clubImageUrl: SOME_URL,
  name: 'secondClub',
  description: Option.some('secondClubDescription'),
  membersCountLimit: 100,
  uuid: generateClubUuid(),
  validUntil: new Date(),
  reportLimit: 10,
}

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user = yield* _(createMockedUser('+420733333339'))

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
            club: firstClub,
          },
        })
      )
      yield* _(
        app.ClubsAdmin.createClub({
          urlParams: {
            adminToken: ADMIN_TOKEN,
          },
          payload: {
            club: secondClub,
          },
        })
      )

      const clubsDb = yield* _(ClubsDbService)
      const {id: firstClubId} = yield* _(
        clubsDb.findClubByUuid({uuid: firstClub.uuid}),
        Effect.flatten
      )
      const {id: secondClubId} = yield* _(
        clubsDb.findClubByUuid({uuid: secondClub.uuid}),
        Effect.flatten
      )

      const clubDb = yield* _(ClubMembersDbService)
      yield* _(
        clubDb.insertClubMember({
          clubId: firstClubId,
          publicKey: memberKeyPair.publicKeyPemBase64,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: Schema.decodeSync(ExpoNotificationToken)(
            'someToken'
          ),
          vexlNotificationToken: Schema.decodeSync(VexlNotificationToken)(
            'vexl_nt_test'
          ),
          publicKeyV2: null,
        })
      )
      yield* _(
        clubDb.insertClubMember({
          clubId: secondClubId,
          publicKey: memberKeyPair.publicKeyPemBase64,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: Schema.decodeSync(ExpoNotificationToken)(
            'someToken'
          ),
          vexlNotificationToken: Schema.decodeSync(VexlNotificationToken)(
            'vexl_nt_test'
          ),
          publicKeyV2: null,
        })
      )
    })
  )
})

describe('Set club public key v2', () => {
  it('Updates only the requested club membership', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const keyPairV2 = yield* _(generateV2KeyPair())

        yield* _(addTestHeaders(user.authHeaders))
        const headers = makeTestCommonAndSecurityHeaders(user.authHeaders)

        const payload = yield* _(
          addChallengeToRequest2(app.Challenges.createChallenge)({
            clubUuid: firstClub.uuid,
            keyPair: memberKeyPair,
            keyPairV2,
          })
        )

        yield* _(
          app.ClubsMember.setPublicKeyV2({
            payload,
            headers,
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const firstClubResult = yield* _(sql`
          SELECT
            club_member.public_key_v2 AS public_key_v2
          FROM
            club_member
            JOIN club ON club.id = club_member.club_id
          WHERE
            club.uuid = ${firstClub.uuid}
            AND club_member.public_key = ${memberKeyPair.publicKeyPemBase64}
        `)
        const secondClubResult = yield* _(sql`
          SELECT
            club_member.public_key_v2 AS public_key_v2
          FROM
            club_member
            JOIN club ON club.id = club_member.club_id
          WHERE
            club.uuid = ${secondClub.uuid}
            AND club_member.public_key = ${memberKeyPair.publicKeyPemBase64}
        `)

        expect(firstClubResult.at(0)?.publicKeyV2).toBe(keyPairV2.publicKey)
        expect(secondClubResult.at(0)?.publicKeyV2).toBe(null)
      })
    )
  })
})
