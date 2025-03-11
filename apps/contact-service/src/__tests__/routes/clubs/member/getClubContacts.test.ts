import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'

import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {
  createMockedUser,
  type MockedUser,
} from '../../../utils/createMockedUser'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const CLUB_VALID_UNTIL = new Date(Date.now() + 1000 * 60 * 60)
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')
let user1: MockedUser
let user2: MockedUser

describe('Get club contacts', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        user1 = yield* _(createMockedUser('+420733333331'))
        user2 = yield* _(createMockedUser('+420733333332'))

        yield* _(sql`DELETE FROM club_invitation_link`)
        yield* _(sql`DELETE FROM club_member`)
        yield* _(sql`DELETE FROM club`)
      })
    )
  })

  it('Should return club members for users that are in the same club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClubUuid = generateClubUuid()

        yield* _(
          app.createClub({
            body: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
              },
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const inviteLink1 = yield* _(
          app.generateClubInviteLinkForAdmin({
            body: {
              clubUuid: forClubUuid,
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user1 joins the club
        yield* _(
          app.joinClub({
            body: {
              code: inviteLink1.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        const inviteLink2 = yield* _(
          app.generateClubInviteLinkForAdmin({
            body: {
              clubUuid: forClubUuid,
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user2 joins the club
        yield* _(
          app.joinClub({
            body: {
              code: inviteLink2.code,
              contactsImported: false,
              signedChallenge: challengeForUser2.signedChallenge,
              publicKey: challengeForUser2.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        const secondChallengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const clubMembers = yield* _(
          app.getClubContacts({
            body: {
              clubUuid: forClubUuid,
              publicKey: secondChallengeForUser1.publicKey,
              signedChallenge: secondChallengeForUser1.signedChallenge,
            },
          })
        )

        expect(clubMembers.items).toHaveLength(2)
        expect(clubMembers.clubUuid).toEqual(forClubUuid)
        expect(clubMembers.items).toContain(
          user1.mainKeyPair.publicKeyPemBase64
        )
        expect(clubMembers.items).toContain(
          user2.mainKeyPair.publicKeyPemBase64
        )
      })
    )
  })

  it('Should return error for invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClubUuid = generateClubUuid()

        yield* _(
          app.createClub({
            body: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
              },
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

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

        yield* _(
          app.joinClub({
            body: {
              code: inviteLink.code,
              contactsImported: false,
              signedChallenge: challengeForUser.signedChallenge,
              publicKey: challengeForUser.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        const secondChallengeForUser = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.getClubContacts({
            body: {
              clubUuid: forClubUuid,
              publicKey: secondChallengeForUser.publicKey,
              signedChallenge: {
                ...secondChallengeForUser.signedChallenge,
                challenge: 'badChallenge' as SignedChallenge['challenge'],
              },
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })

  it('Should return error 400 if user want to see members of a club he is not part of', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClubUuid1 = generateClubUuid()
        const forClubUuid2 = generateClubUuid()

        yield* _(
          app.createClub({
            body: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid1,
                validUntil: CLUB_VALID_UNTIL,
              },
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const inviteLink1 = yield* _(
          app.generateClubInviteLinkForAdmin({
            body: {
              clubUuid: forClubUuid1,
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user1 joins the first club
        yield* _(
          app.joinClub({
            body: {
              code: inviteLink1.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        yield* _(
          app.createClub({
            body: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid2,
                validUntil: CLUB_VALID_UNTIL,
              },
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const inviteLink2 = yield* _(
          app.generateClubInviteLinkForAdmin({
            body: {
              clubUuid: forClubUuid2,
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user2 joins the second club
        yield* _(
          app.joinClub({
            body: {
              code: inviteLink2.code,
              contactsImported: false,
              signedChallenge: challengeForUser2.signedChallenge,
              publicKey: challengeForUser2.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        const secondChallengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.getClubContacts({
            body: {
              clubUuid: forClubUuid1,
              publicKey: secondChallengeForUser2.publicKey,
              signedChallenge: secondChallengeForUser2.signedChallenge,
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

  it('Should return error 404 for requesting users of non existing club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClubUuid = generateClubUuid()
        const notExistingClubUuid = generateClubUuid()

        yield* _(
          app.createClub({
            body: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
              },
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

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

        // user1 joins the club
        yield* _(
          app.joinClub({
            body: {
              code: inviteLink.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.getClubContacts({
            body: {
              clubUuid: notExistingClubUuid,
              publicKey: challengeForUser2.publicKey,
              signedChallenge: challengeForUser2.signedChallenge,
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

  it('Should return error 404 for non existing club member requesting other club members', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClubUuid = generateClubUuid()

        yield* _(
          app.createClub({
            body: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
              },
            },
            query: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

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

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        // user1 joins the club
        yield* _(
          app.joinClub({
            body: {
              code: inviteLink.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
            },
          })
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.getClubContacts({
            body: {
              clubUuid: forClubUuid,
              publicKey: challengeForUser2.publicKey,
              signedChallenge: challengeForUser2.signedChallenge,
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
