import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {addChallengeToRequest2} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
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
    Effect.gen(function* () {
      user = yield* createMockedUser('+420733333339')

      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM club_invitation_link`
      yield* sql`DELETE FROM club_member`
      yield* sql`DELETE FROM club`

      const app = yield* NodeTestingApp
      yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
      yield* app.ClubsAdmin.createClub({
        headers: {'x-admin-token': ADMIN_TOKEN},
        payload: {
          club: firstClub,
        },
      })
      yield* app.ClubsAdmin.createClub({
        headers: {'x-admin-token': ADMIN_TOKEN},
        payload: {
          club: secondClub,
        },
      })

      const clubsDb = yield* ClubsDbService
      const {id: firstClubId} = yield* pipe(
        clubsDb.findClubByUuid({uuid: firstClub.uuid}),
        Effect.flatMap(Effect.fromOption)
      )
      const {id: secondClubId} = yield* pipe(
        clubsDb.findClubByUuid({uuid: secondClub.uuid}),
        Effect.flatMap(Effect.fromOption)
      )

      const clubDb = yield* ClubMembersDbService
      yield* clubDb.insertClubMember({
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
      yield* clubDb.insertClubMember({
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
    })
  )
})

describe('Set club public key v2', () => {
  it('Updates only the requested club membership', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const keyPairV2 = yield* generateV2KeyPair()

        yield* addTestHeaders(user.authHeaders)
        const headers = makeTestCommonAndSecurityHeaders(user.authHeaders)

        const payload = yield* addChallengeToRequest2(
          app.Challenges.createChallenge
        )({
          clubUuid: firstClub.uuid,
          keyPair: memberKeyPair,
          keyPairV2,
        })

        yield* app.ClubsMember.setPublicKeyV2({
          payload,
          headers,
        })

        const sql = yield* SqlClient.SqlClient
        const firstClubResult = yield* sql`
          SELECT
            club_member.public_key_v2 AS public_key_v2
          FROM
            club_member
            JOIN club ON club.id = club_member.club_id
          WHERE
            club.uuid = ${firstClub.uuid}
            AND club_member.public_key = ${memberKeyPair.publicKeyPemBase64}
        `
        const secondClubResult = yield* sql`
          SELECT
            club_member.public_key_v2 AS public_key_v2
          FROM
            club_member
            JOIN club ON club.id = club_member.club_id
          WHERE
            club.uuid = ${secondClub.uuid}
            AND club_member.public_key = ${memberKeyPair.publicKeyPemBase64}
        `

        expect(firstClubResult.at(0)?.publicKeyV2).toBe(keyPairV2.publicKey)
        expect(secondClubResult.at(0)?.publicKeyV2).toBe(null)
      })
    )
  })
})
