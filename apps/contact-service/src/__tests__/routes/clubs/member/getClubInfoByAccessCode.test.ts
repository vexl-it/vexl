import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ClubCode,
  generateClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {InvalidChallengeError} from '@vexl-next/rest-api/src/challenges/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {ClubInvitationLinkDbService} from '../../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

const userKey = generatePrivateKey()
const forClubUuid = generateClubUuid()

const club = {
  clubImageUrl: SOME_URL,
  name: 'someName',
  description: Option.some('someDescription'),
  membersCountLimit: 100,
  uuid: forClubUuid,
  validUntil: new Date(),
  reportLimit: 10,
}
let clubId: ClubRecordId

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM club_invitation_link`
      yield* sql`DELETE FROM club_member`
      yield* sql`DELETE FROM club`

      const app = yield* NodeTestingApp
      yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
      yield* app.ClubsAdmin.createClub({
        headers: {'x-admin-token': ADMIN_TOKEN},
        payload: {
          club,
        },
      })

      const clubDb = yield* ClubsDbService
      const clubIdResult = yield* pipe(
        clubDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatMap(Effect.fromOption)
      )
      clubId = clubIdResult.id
    })
  )
})

describe('Get club info by access code', () => {
  it('should return club info by access code', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const challengeForUser = yield* generateAndSignChallenge(userKey)

        const inviteDb = yield* ClubInvitationLinkDbService

        const inviteLink = yield* inviteDb.insertInvitationLink({
          clubId,
          code: '123456' as ClubCode,
          forAdmin: false,
          createdByMemberId: null,
        })

        const clubInfo = yield* app.ClubsMember.getClubInfoByAccessCode({
          payload: {
            publicKey: challengeForUser.publicKey,
            publicKeyV2: challengeForUser.publicKeyV2,
            signedChallenge: challengeForUser.signedChallenge,
            code: inviteLink.code,
          },
        })

        expect(clubInfo).toEqual({club, isModerator: false})
      })
    )
  })

  it('should return club info by access code for moderator', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const challengeForUser = yield* generateAndSignChallenge(userKey)

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const inviteLink = yield* app.ClubsAdmin.generateClubInviteLinkForAdmin(
          {
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              clubUuid: forClubUuid,
            },
          }
        )

        const clubInfo = yield* app.ClubsMember.getClubInfoByAccessCode({
          payload: {
            publicKey: challengeForUser.publicKey,
            publicKeyV2: challengeForUser.publicKeyV2,
            signedChallenge: challengeForUser.signedChallenge,
            code: inviteLink.link.code,
          },
        })

        expect(clubInfo).toEqual({club, isModerator: true})
      })
    )
  })

  it('Should return 404 when link not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const challengeForUser = yield* generateAndSignChallenge(userKey)

        const errorResponse = yield* pipe(
          app.ClubsMember.getClubInfoByAccessCode({
            payload: {
              publicKey: challengeForUser.publicKey,
              publicKeyV2: challengeForUser.publicKeyV2,
              signedChallenge: challengeForUser.signedChallenge,
              code: 'badCode' as ClubCode,
            },
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Should return error when bad challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const signedChallenge = yield* generateAndSignChallenge(userKey)
        const invalidKey = generatePrivateKey()

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const inviteLink = yield* app.ClubsAdmin.generateClubInviteLinkForAdmin(
          {
            headers: {'x-admin-token': ADMIN_TOKEN},
            payload: {
              clubUuid: forClubUuid,
            },
          }
        )

        const errorResponse = yield* pipe(
          app.ClubsMember.getClubInfoByAccessCode({
            payload: {
              publicKey: invalidKey.publicKeyPemBase64,
              publicKeyV2: signedChallenge.publicKeyV2,
              signedChallenge: signedChallenge.signedChallenge,
              code: inviteLink.link.code,
            },
          }),
          Effect.result
        )
        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
})
