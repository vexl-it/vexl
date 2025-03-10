import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {MemberAlreadyInClubError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {ClubInvitationLinkDbService} from '../../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')

const userKey = generatePrivateKey()
const INVITATION_CODE = '111111'

const club = {
  clubImageUrl: SOME_URL,
  name: 'someName',
  description: Option.some('someDescription'),
  membersCountLimit: 100,
  uuid: generateClubUuid(),
  validUntil: new Date(),
}

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
      const {id: clubId} = yield* _(
        clubsDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatten
      )

      const invitationService = yield* _(ClubInvitationLinkDbService)
      yield* _(
        invitationService.insertInvitationLink({
          clubId,
          code: INVITATION_CODE,
          forAdmin: false,
          createdByMemberId: null,
        })
      )
    })
  )
})

describe('Join club', () => {
  it('Should join club with invitation link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const joinedClub = yield* _(
          app.joinClub({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const joinedClub2 = yield* _(
          app.getClubInfo({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        expect(joinedClub2.clubInfoForUser).toEqual(joinedClub.clubInfoForUser)
        expect(joinedClub.clubInfoForUser).toEqual({
          club,
          isModerator: false,
        })
      })
    )
  })
  it('Should join club as moderator with moderator invitation link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const inviteLink = yield* _(
          app.generateClubInviteLinkForAdmin({
            query: {
              adminToken: ADMIN_TOKEN,
            },
            body: {
              clubUuid: club.uuid,
            },
          })
        )

        const joinedClub = yield* _(
          app.joinClub({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: inviteLink.code,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const joinedClub2 = yield* _(
          app.getClubInfo({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        expect(joinedClub2.clubInfoForUser).toEqual(joinedClub.clubInfoForUser)
        expect(joinedClub.clubInfoForUser).toEqual({
          club,
          isModerator: true,
        })
      })
    )
  })
  it('Returns error when invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const signedChallenge = yield* _(generateAndSignChallenge(userKey))

        const errorResponse = yield* _(
          app.joinClub({
            body: {
              signedChallenge: {
                ...signedChallenge.signedChallenge,
                challenge: 'badChallenge' as SignedChallenge['challenge'],
              },
              publicKey: signedChallenge.publicKey,
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              contactsImported: false,
            },
          }),
          Effect.either
        )
        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
  it('Returns error when member already in club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        yield* _(
          app.joinClub({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const errorResponse = yield* _(
          app.joinClub({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              contactsImported: false,
            },
          }),
          Effect.either
        )
        expectErrorResponse(MemberAlreadyInClubError)(errorResponse)
      })
    )
  })
  it('Returns error when invitation link not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const errorResponse = yield* _(
          app.joinClub({
            body: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: '123445',
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              contactsImported: false,
            },
          }),
          Effect.either
        )
        if (errorResponse._tag !== 'Left') {
          throw new Error('Expected error response')
        }
        expect((errorResponse.left as any).status).toEqual(404)
      })
    )
  })
})
