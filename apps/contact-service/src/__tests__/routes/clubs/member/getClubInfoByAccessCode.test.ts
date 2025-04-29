import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ClubCode,
  generateClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {ClubInvitationLinkDbService} from '../../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')

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
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM club_invitation_link`)
      yield* _(sql`DELETE FROM club_member`)
      yield* _(sql`DELETE FROM club`)

      const app = yield* _(NodeTestingApp)
      yield* _(
        app.createClub({
          body: {
            club,
          },
          query: {
            adminToken: ADMIN_TOKEN,
          },
        })
      )

      const clubDb = yield* _(ClubsDbService)
      const clubIdResult = yield* _(
        clubDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatten
      )
      clubId = clubIdResult.id
    })
  )
})

describe('Get club info by access code', () => {
  it('should return club info by access code', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challengeForUser = yield* _(generateAndSignChallenge(userKey))

        const inviteDb = yield* _(ClubInvitationLinkDbService)

        const inviteLink = yield* _(
          inviteDb.insertInvitationLink({
            clubId,
            code: '123456' as ClubCode,
            forAdmin: false,
            createdByMemberId: null,
          })
        )

        const clubInfo = yield* _(
          app.getClubInfoByAccessCode({
            body: {
              publicKey: userKey.publicKeyPemBase64,
              signedChallenge: challengeForUser.signedChallenge,
              code: inviteLink.code,
            },
          })
        )

        expect(clubInfo).toEqual({club, isModerator: false})
      })
    )
  })

  it('should return club info by access code for moderator', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challengeForUser = yield* _(generateAndSignChallenge(userKey))

        const inviteLink = yield* _(
          app.generateClubInviteLinkForAdmin({
            body: {
              clubUuid: forClubUuid,
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const clubInfo = yield* _(
          app.getClubInfoByAccessCode({
            body: {
              publicKey: userKey.publicKeyPemBase64,
              signedChallenge: challengeForUser.signedChallenge,
              code: inviteLink.link.code,
            },
          })
        )

        expect(clubInfo).toEqual({club, isModerator: true})
      })
    )
  })

  it('Should return 404 when link not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challengeForUser = yield* _(generateAndSignChallenge(userKey))

        const errorResponse = yield* _(
          app.getClubInfoByAccessCode({
            body: {
              publicKey: userKey.publicKeyPemBase64,
              signedChallenge: challengeForUser.signedChallenge,
              code: 'badCode' as ClubCode,
            },
          }),
          Effect.either
        )

        expectErrorResponse(404)(errorResponse)
      })
    )
  })

  it('Should return error when bad challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const signedChallenge = yield* _(generateAndSignChallenge(userKey))

        const inviteLink = yield* _(
          app.generateClubInviteLinkForAdmin({
            body: {
              clubUuid: forClubUuid,
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const errorResponse = yield* _(
          app.getClubInfoByAccessCode({
            body: {
              publicKey: signedChallenge.publicKey,
              signedChallenge: {
                ...signedChallenge.signedChallenge,
                challenge: 'badChallenge' as SignedChallenge['challenge'],
              },
              code: inviteLink.link.code,
            },
          }),
          Effect.either
        )
        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
})
