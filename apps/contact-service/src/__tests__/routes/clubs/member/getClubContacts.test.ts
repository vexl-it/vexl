import {SqlClient} from '@effect/sql'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'

import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
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
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')
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

        yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
        yield* _(
          app.ClubsAdmin.createClub({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
                reportLimit: 10,
              },
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
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: forClubUuid,
            },
          })
        )

        // user1 joins the club
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink1.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        const inviteLink2 = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: forClubUuid,
            },
          })
        )

        // user2 joins the club
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink2.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser2.signedChallenge,
              publicKey: challengeForUser2.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        const secondChallengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const clubMembers = yield* _(
          app.ClubsMember.getClubContacts({
            payload: {
              clubUuid: forClubUuid,
              publicKey: secondChallengeForUser1.publicKey,
              signedChallenge: secondChallengeForUser1.signedChallenge,
            },
          })
        )

        expect(clubMembers.items).toHaveLength(2)
        expect(clubMembers.itemsV2).toHaveLength(2)
        expect(clubMembers.clubUuid).toEqual(forClubUuid)
        // Legacy items field contains only publicKey strings
        expect(clubMembers.items).toContain(
          user1.mainKeyPair.publicKeyPemBase64
        )
        expect(clubMembers.items).toContain(
          user2.mainKeyPair.publicKeyPemBase64
        )
        // V2 items field contains objects with publicKey and optional publicKeyV2
        expect(clubMembers.itemsV2.map((item) => item.publicKey)).toContain(
          user1.mainKeyPair.publicKeyPemBase64
        )
        expect(clubMembers.itemsV2.map((item) => item.publicKey)).toContain(
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
          app.ClubsAdmin.createClub({
            payload: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
                reportLimit: 10,
              },
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const inviteLink = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            payload: {
              clubUuid: forClubUuid,
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser.signedChallenge,
              publicKey: challengeForUser.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        const secondChallengeForUser = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.ClubsMember.getClubContacts({
            payload: {
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
          app.ClubsAdmin.createClub({
            payload: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid1,
                validUntil: CLUB_VALID_UNTIL,
                reportLimit: 10,
              },
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const inviteLink1 = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            payload: {
              clubUuid: forClubUuid1,
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user1 joins the first club
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink1.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        yield* _(
          app.ClubsAdmin.createClub({
            payload: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid2,
                validUntil: CLUB_VALID_UNTIL,
                reportLimit: 10,
              },
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const inviteLink2 = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            payload: {
              clubUuid: forClubUuid2,
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user2 joins the second club
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink2.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser2.signedChallenge,
              publicKey: challengeForUser2.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        const secondChallengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.ClubsMember.getClubContacts({
            payload: {
              clubUuid: forClubUuid1,
              publicKey: secondChallengeForUser2.publicKey,
              signedChallenge: secondChallengeForUser2.signedChallenge,
            },
          }),
          Effect.either
        )
        expectErrorResponse(NotFoundError)(errorResponse)
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
          app.ClubsAdmin.createClub({
            payload: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
                reportLimit: 10,
              },
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const inviteLink = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            payload: {
              clubUuid: forClubUuid,
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        // user1 joins the club
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.ClubsMember.getClubContacts({
            payload: {
              clubUuid: notExistingClubUuid,
              publicKey: challengeForUser2.publicKey,
              signedChallenge: challengeForUser2.signedChallenge,
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Should return error 404 for non existing club member requesting other club members', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const forClubUuid = generateClubUuid()

        yield* _(
          app.ClubsAdmin.createClub({
            payload: {
              club: {
                clubImageUrl: SOME_URL,
                name: 'someName',
                description: Option.some('someDescription'),
                membersCountLimit: 100,
                uuid: forClubUuid,
                validUntil: CLUB_VALID_UNTIL,
                reportLimit: 10,
              },
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const inviteLink = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            payload: {
              clubUuid: forClubUuid,
            },
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
          })
        )

        const challengeForUser1 = yield* _(
          generateAndSignChallenge(user1.mainKeyPair)
        )

        // user1 joins the club
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              code: inviteLink.link.code,
              contactsImported: false,
              signedChallenge: challengeForUser1.signedChallenge,
              publicKey: challengeForUser1.publicKey,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              publicKeyV2: Option.none(),
            },
          })
        )

        const challengeForUser2 = yield* _(
          generateAndSignChallenge(user2.mainKeyPair)
        )

        const errorResponse = yield* _(
          app.ClubsMember.getClubContacts({
            payload: {
              clubUuid: forClubUuid,
              publicKey: challengeForUser2.publicKey,
              signedChallenge: challengeForUser2.signedChallenge,
            },
          }),
          Effect.either
        )
        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })
})
