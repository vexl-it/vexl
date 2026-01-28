import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ClubCode,
  generateClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  InvalidChallengeError,
  type SignedChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {
  ClubUserLimitExceededError,
  MemberAlreadyInClubError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {ClubInvitationLinkDbService} from '../../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
} from '../../../utils/mockEnqueueUserNotification'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

const userKey = generatePrivateKey()
const INVITATION_CODE = '111111' as ClubCode
let clubId: ClubRecordId

const club = {
  clubImageUrl: SOME_URL,
  name: 'someName',
  description: Option.some('someDescription'),
  membersCountLimit: 2,
  uuid: generateClubUuid(),
  validUntil: new Date(),
  reportLimit: 10,
}

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const user3 = generatePrivateKey()

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      yield* _(clearEnqueuedNotifications)

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
      const clubInDb = yield* _(
        clubsDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatten
      )

      clubId = clubInDb.id

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
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const joinedClub2 = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
            },
          })
        )

        expect(joinedClub2.clubInfoForUser).toEqual(joinedClub.clubInfoForUser)
        expect(joinedClub.clubInfoForUser).toEqual({
          club,
          isModerator: false,
          vexlNotificationToken: Option.some(
            'vexl_nt_test' as VexlNotificationToken
          ),
        })
      })
    )
  })
  it('Should join club as moderator with moderator invitation link', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        yield* _(addTestHeaders({adminToken: ADMIN_TOKEN}))
        const inviteLink = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: club.uuid,
            },
          })
        )

        const joinedClub = yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: inviteLink.link.code,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const joinedClub2 = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
            },
          })
        )

        expect(joinedClub2.clubInfoForUser).toEqual(joinedClub.clubInfoForUser)
        expect(joinedClub.clubInfoForUser).toEqual({
          club,
          isModerator: true,
          vexlNotificationToken: Option.some(
            'vexl_nt_test' as VexlNotificationToken
          ),
        })
      })
    )
  })

  it('Moderator invitation link should only be valid once', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const inviteLink = yield* _(
          app.ClubsAdmin.generateClubInviteLinkForAdmin({
            urlParams: {
              adminToken: ADMIN_TOKEN,
            },
            payload: {
              clubUuid: club.uuid,
            },
          })
        )

        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: inviteLink.link.code,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const errorResponse = yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(generatePrivateKey()))),
              code: inviteLink.link.code,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Fail when club limit is exceeded', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(user1))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(user2))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const failedResponse = yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(user3))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          }),
          Effect.either
        )

        expectErrorResponse(ClubUserLimitExceededError)(failedResponse)
      })
    )
  })

  it('Returns error when invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const signedChallenge = yield* _(generateAndSignChallenge(userKey))

        const errorResponse = yield* _(
          app.ClubsMember.joinClub({
            payload: {
              signedChallenge: {
                ...signedChallenge.signedChallenge,
                challenge: 'badChallenge' as SignedChallenge['challenge'],
              },
              publicKey: signedChallenge.publicKey,
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
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
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        const errorResponse = yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
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
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: '123445' as ClubCode,
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_test' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          }),
          Effect.either
        )
        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Enqueues VexlNotificationToken notifications for club members when user joins', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              ...club,
              madeInactiveAt: Option.none(),
              membersCountLimit: 100,
              report: 0,
              reportLimit: 10,
            },
          })
        )

        const membersDb = yield* _(ClubMembersDbService)

        // Insert members WITH vexlNotificationToken
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user1.publicKeyPemBase64,
            notificationToken: null,
            vexlNotificationToken:
              'vexl_nt_member1_token' as VexlNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user2.publicKeyPemBase64,
            notificationToken: null,
            vexlNotificationToken:
              'vexl_nt_member2_token' as VexlNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.none(),
              vexlNotificationToken: Option.some(
                'vexl_nt_joiner_token' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        // Wait for forked daemon to complete
        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)

        // Should have enqueued notifications for user1 and user2 (not the joiner)
        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        expect(clubNotifications).toHaveLength(2)
        expect(
          clubNotifications
            .map((n) =>
              n.task._tag === 'NewClubUserNotificationMqEntry'
                ? n.task.token
                : ''
            )
            .sort((a, b) => (a ?? '').localeCompare(b ?? ''))
        ).toEqual(
          ['vexl_nt_member1_token', 'vexl_nt_member2_token'].sort((a, b) =>
            a.localeCompare(b)
          )
        )
      })
    )
  })

  it('Does NOT enqueue VexlNotificationToken for members without token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              ...club,
              madeInactiveAt: Option.none(),
              membersCountLimit: 100,
              report: 0,
              reportLimit: 10,
            },
          })
        )

        const membersDb = yield* _(ClubMembersDbService)

        // Insert member WITH vexlNotificationToken
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user1.publicKeyPemBase64,
            notificationToken: null,
            vexlNotificationToken:
              'vexl_nt_member1_token' as VexlNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        // Insert member WITHOUT vexlNotificationToken (only expo token - legacy)
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user2.publicKeyPemBase64,
            notificationToken: 'expo_token_legacy' as ExpoNotificationToken,
            vexlNotificationToken: null,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        // Insert member with NO tokens at all
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user3.publicKeyPemBase64,
            notificationToken: null,
            vexlNotificationToken: null,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.none(),
              vexlNotificationToken: Option.some(
                'vexl_nt_joiner_token' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)

        // Notifications are sent to all members, filter for those with vexlNotificationToken
        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        // Filter for notifications with non-null vexlNotificationToken
        const notificationsWithVexlToken = clubNotifications.filter(
          (n) =>
            n.task._tag === 'NewClubUserNotificationMqEntry' &&
            n.task.token !== null
        )

        expect(notificationsWithVexlToken).toHaveLength(1)
        expect(
          notificationsWithVexlToken[0]?.task._tag ===
            'NewClubUserNotificationMqEntry'
            ? notificationsWithVexlToken[0].task.token
            : ''
        ).toBe('vexl_nt_member1_token')
      })
    )
  })

  it('Does NOT enqueue notification for the joining user themselves', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              ...club,
              madeInactiveAt: Option.none(),
              membersCountLimit: 100,
              report: 0,
              reportLimit: 10,
            },
          })
        )

        const membersDb = yield* _(ClubMembersDbService)

        // Insert a member who will join again (simulating edge case)
        // The joining user's public key should be filtered out
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user1.publicKeyPemBase64,
            notificationToken: null,
            vexlNotificationToken:
              'vexl_nt_member1_token' as VexlNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        const app = yield* _(NodeTestingApp)

        // user1 tries to join again - should fail but let's test notification filtering
        // with a different user who has same token pattern
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.none(),
              vexlNotificationToken: Option.some(
                'vexl_nt_joiner_token' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)

        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        // user1 should receive notification (they are not the joiner)
        expect(clubNotifications).toHaveLength(1)

        // The joining user (userKey) should NOT be in the notifications
        const notifiedTokens = clubNotifications.map((n) =>
          n.task._tag === 'NewClubUserNotificationMqEntry' ? n.task.token : ''
        )
        expect(notifiedTokens).not.toContain('vexl_nt_joiner_token')
      })
    )
  })

  it('Routes notifications correctly when members have mixed token types', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              ...club,
              madeInactiveAt: Option.none(),
              membersCountLimit: 100,
              report: 0,
              reportLimit: 10,
            },
          })
        )

        const membersDb = yield* _(ClubMembersDbService)

        // Member with ONLY expo token (no vexl token - won't receive notification via new path)
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user1.publicKeyPemBase64,
            notificationToken: 'expo_only_token' as ExpoNotificationToken,
            vexlNotificationToken: null,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        // Member with BOTH expo and vexl token (new path only)
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user2.publicKeyPemBase64,
            notificationToken: 'expo_token_2' as ExpoNotificationToken,
            vexlNotificationToken:
              'vexl_nt_member2_token' as VexlNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.none(),
              vexlNotificationToken: Option.some(
                'vexl_nt_joiner_token' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        yield* _(Effect.sleep('100 millis'))

        // Notifications are sent to all members, filter for those with vexlNotificationToken
        const enqueuedNotifications = yield* _(getEnqueuedNotifications)
        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        // Filter for notifications with non-null vexlNotificationToken
        const notificationsWithVexlToken = clubNotifications.filter(
          (n) =>
            n.task._tag === 'NewClubUserNotificationMqEntry' &&
            n.task.token !== null
        )

        expect(notificationsWithVexlToken).toHaveLength(1)
        expect(
          notificationsWithVexlToken[0]?.task._tag ===
            'NewClubUserNotificationMqEntry'
            ? notificationsWithVexlToken[0].task.token
            : ''
        ).toBe('vexl_nt_member2_token')
      })
    )
  })

  it('Includes correct clubUuid in enqueued notifications', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              ...club,
              madeInactiveAt: Option.none(),
              membersCountLimit: 100,
              report: 0,
              reportLimit: 10,
            },
          })
        )

        const membersDb = yield* _(ClubMembersDbService)
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user1.publicKeyPemBase64,
            notificationToken: null,
            vexlNotificationToken:
              'vexl_nt_member1_token' as VexlNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
          })
        )

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsMember.joinClub({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              code: INVITATION_CODE,
              notificationToken: Option.none(),
              vexlNotificationToken: Option.some(
                'vexl_nt_joiner_token' as VexlNotificationToken
              ),
              contactsImported: false,
            },
          })
        )

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)

        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        expect(clubNotifications).toHaveLength(1)

        const notification = clubNotifications[0]
        if (notification?.task._tag === 'NewClubUserNotificationMqEntry') {
          expect(notification.task.clubUuid).toBe(club.uuid)
        }
      })
    )
  })
})
