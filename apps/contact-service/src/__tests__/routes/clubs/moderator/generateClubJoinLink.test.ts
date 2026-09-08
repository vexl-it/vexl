import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserIsNotModeratorError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

const userKey = generatePrivateKey()

const user1 = generatePrivateKey()

const club = {
  clubImageUrl: SOME_URL,
  name: 'someName',
  description: Option.some('someDescription'),
  membersCountLimit: 3,
  uuid: generateClubUuid(),
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

      const clubsDb = yield* ClubsDbService
      const createdClub = yield* pipe(
        clubsDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatMap(Effect.fromOption)
      )
      clubId = createdClub.id

      const clubDb = yield* ClubMembersDbService
      yield* clubDb.insertClubMember({
        clubId,
        publicKey: userKey.publicKeyPemBase64,
        isModerator: true,
        lastRefreshedAt: new Date(),
        notificationToken: 'someToken' as ExpoNotificationToken,
        vexlNotificationToken: 'vexl_nt_test' as VexlNotificationToken,
        publicKeyV2: null,
      })
    })
  )
})

describe('Generate club join link', () => {
  it('Generates club join link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const joinLinkResponse = yield* app.ClubsModerator.generateClubJoinLink(
          {
            payload: {
              clubUuid: club.uuid,
              ...(yield* generateAndSignChallenge(userKey)),
            },
          }
        )
        expect(joinLinkResponse.codeInfo.code).toBeDefined()
        expect(
          joinLinkResponse.codeInfo.fullLink.includes(
            joinLinkResponse.codeInfo.code
          )
        ).toBeTruthy()

        yield* app.ClubsMember.joinClub({
          headers: testCommonHeaders,
          payload: {
            code: joinLinkResponse.codeInfo.code,
            ...(yield* generateAndSignChallenge(user1)),
            contactsImported: false,
            notificationToken: Option.none(),
            vexlNotificationToken: Option.none(),
            publicKeyV2: Option.none(),
          },
        })
      })
    )
  })

  it('Fails with UserIsNotModeratorError when member is not a moderator', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const memberDb = yield* ClubMembersDbService
        const nonModeratorMember = generatePrivateKey()
        yield* memberDb.insertClubMember({
          publicKey: nonModeratorMember.publicKeyPemBase64,
          clubId,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: null,
          vexlNotificationToken: null,
          publicKeyV2: null,
        })

        const errorResponse = yield* pipe(
          app.ClubsModerator.generateClubJoinLink({
            payload: {
              clubUuid: club.uuid,
              ...(yield* generateAndSignChallenge(nonModeratorMember)),
            },
          }),
          Effect.result
        )

        expectErrorResponse(UserIsNotModeratorError)(errorResponse)
      })
    )
  })

  it('Fails with 404 when member is not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const nonModeratorMember = generatePrivateKey()

        const errorResponse = yield* pipe(
          app.ClubsModerator.generateClubJoinLink({
            payload: {
              clubUuid: club.uuid,
              ...(yield* generateAndSignChallenge(nonModeratorMember)),
            },
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Fails with 404 when club is not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const errorResponse = yield* pipe(
          app.ClubsModerator.generateClubJoinLink({
            payload: {
              clubUuid: generateClubUuid(),
              ...(yield* generateAndSignChallenge(userKey)),
            },
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Fails with Invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge(userKey)

        const errorResponse = yield* pipe(
          app.ClubsModerator.generateClubJoinLink({
            payload: {
              clubUuid: club.uuid,
              ...challenge,
              signedChallenge: {
                challenge: challenge.signedChallenge.challenge,
                signature: 'invalidSignature' as SignedChallenge['signature'],
                signatureV2: Option.none(),
              },
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
})
