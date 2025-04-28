import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {UserIsNotModeratorError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')

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

      const clubsDb = yield* _(ClubsDbService)
      const createdClub = yield* _(
        clubsDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatten
      )
      clubId = createdClub.id

      const clubDb = yield* _(ClubMembersDbService)
      yield* _(
        clubDb.insertClubMember({
          clubId,
          publicKey: userKey.publicKeyPemBase64,
          isModerator: true,
          lastRefreshedAt: new Date(),
          notificationToken: 'someToken' as ExpoNotificationToken,
        })
      )
    })
  )
})

describe('Generate club join link', () => {
  it('Generates club join link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const joinLinkResponse = yield* _(
          app.generateClubJoinLink({
            body: {
              clubUuid: club.uuid,

              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )
        expect(joinLinkResponse.codeInfo.code).toBeDefined()
        expect(
          joinLinkResponse.codeInfo.fullLink.includes(
            joinLinkResponse.codeInfo.code
          )
        ).toBeTruthy()

        yield* _(
          app.joinClub({
            body: {
              code: joinLinkResponse.codeInfo.code,
              ...(yield* _(generateAndSignChallenge(user1))),
              contactsImported: false,
              notificationToken: Option.none(),
            },
          })
        )
      })
    )
  })

  it('Fails with UserIsNotModeratorError when member is not a moderator', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const memberDb = yield* _(ClubMembersDbService)
        const nonModeratorMember = generatePrivateKey()
        yield* _(
          memberDb.insertClubMember({
            publicKey: nonModeratorMember.publicKeyPemBase64,
            clubId,
            isModerator: false,
            lastRefreshedAt: new Date(),
            notificationToken: null,
          })
        )

        const errorResponse = yield* _(
          app.generateClubJoinLink({
            body: {
              clubUuid: club.uuid,

              ...(yield* _(generateAndSignChallenge(nonModeratorMember))),
            },
          }),
          Effect.either
        )

        expectErrorResponse(UserIsNotModeratorError)(errorResponse)
      })
    )
  })

  it('Fails with 404 when member is not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const nonModeratorMember = generatePrivateKey()

        const errorResponse = yield* _(
          app.generateClubJoinLink({
            body: {
              clubUuid: club.uuid,

              ...(yield* _(generateAndSignChallenge(nonModeratorMember))),
            },
          }),
          Effect.either
        )

        expectErrorResponse(404)(errorResponse)
      })
    )
  })

  it('Fails with 404 when club is not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const errorResponse = yield* _(
          app.generateClubJoinLink({
            body: {
              clubUuid: generateClubUuid(),

              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          }),
          Effect.either
        )

        expectErrorResponse(404)(errorResponse)
      })
    )
  })

  it('Fails with Invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challenge = yield* _(generateAndSignChallenge(userKey))

        const errorResponse = yield* _(
          app.generateClubJoinLink({
            body: {
              clubUuid: club.uuid,

              ...challenge,
              signedChallenge: {
                challenge: challenge.signedChallenge.challenge,
                signature: 'invalidSignature' as SignedChallenge['signature'],
              },
            },
          }),

          Effect.either
        )

        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
})
