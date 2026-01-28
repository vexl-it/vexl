import {SqlClient} from '@effect/sql'
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
import {UserIsNotModeratorError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, Order, Schema} from 'effect'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

const userKey = generatePrivateKey()

const club = {
  clubImageUrl: SOME_URL,
  name: 'someName',
  description: Option.some('someDescription'),
  membersCountLimit: 100,
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
      yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
      yield* _(
        app.ClubsAdmin.createClub({
          urlParams: {
            adminToken: ADMIN_TOKEN,
          },
          payload: {
            club,
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
          vexlNotificationToken: 'vexl_nt_test' as VexlNotificationToken,
        })
      )
    })
  )
})

const sortLinks = Array.sortBy(Order.string)

describe('List club links', () => {
  it('Should return club links', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const link1 = yield* _(
          app.ClubsModerator.generateClubJoinLink({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              clubUuid: club.uuid,
            },
          })
        )
        const link2 = yield* _(
          app.ClubsModerator.generateClubJoinLink({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              clubUuid: club.uuid,
            },
          })
        )

        const linksListResponse = yield* _(
          app.ClubsModerator.listClubLinks({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              clubUuid: club.uuid,
            },
          })
        )

        expect(linksListResponse.clubUuid).toEqual(club.uuid)
        const receivedCodes = sortLinks(
          linksListResponse.links.map((link) => link.code)
        )

        const expectedCodes = sortLinks([
          link1.codeInfo.code,
          link2.codeInfo.code,
        ])
        expect(receivedCodes).toEqual(expectedCodes)

        const receivedFullLinks = sortLinks(
          linksListResponse.links.map((link) => link.fullLink)
        )
        const expectedFullLinks = sortLinks([
          link1.codeInfo.fullLink,
          link2.codeInfo.fullLink,
        ])
        expect(receivedFullLinks).toEqual(expectedFullLinks)
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
            vexlNotificationToken: null,
          })
        )

        const errorResponse = yield* _(
          app.ClubsModerator.listClubLinks({
            payload: {
              ...(yield* _(generateAndSignChallenge(nonModeratorMember))),
              clubUuid: club.uuid,
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
          app.ClubsModerator.listClubLinks({
            payload: {
              ...(yield* _(generateAndSignChallenge(nonModeratorMember))),
              clubUuid: club.uuid,
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Fails with 404 when club is not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const errorResponse = yield* _(
          app.ClubsModerator.listClubLinks({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              clubUuid: generateClubUuid(),
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Fails with Invalid challenge when club is not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challenge = yield* _(generateAndSignChallenge(userKey))

        const errorResponse = yield* _(
          app.ClubsModerator.listClubLinks({
            payload: {
              ...challenge,
              signedChallenge: {
                challenge: challenge.signedChallenge.challenge,
                signature: 'invalidSignature' as SignedChallenge['signature'],
              },
              clubUuid: club.uuid,
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })

  it('Fails with 404 when user is in different club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const user2 = generatePrivateKey()
        const club2 = {
          clubImageUrl: SOME_URL,
          name: 'someName2',
          description: Option.some('someDescription'),
          membersCountLimit: 100,
          uuid: generateClubUuid(),
          validUntil: new Date(),
          reportLimit: 10,
        }
        yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
        yield* _(
          app.ClubsAdmin.createClub({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              club: club2,
            },
          })
        )
        const adminInviteCodeForClub2 = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: club2.uuid,
            },
          })
        )

        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: adminInviteCodeForClub2.link.code,
              ...(yield* _(generateAndSignChallenge(user2))),
              contactsImported: false,
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
            },
          })
        )

        const errorResponse = yield* _(
          app.ClubsModerator.listClubLinks({
            payload: {
              ...(yield* _(generateAndSignChallenge(user2))),
              clubUuid: club.uuid,
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
