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
import {
  ClubUserLimitExceededError,
  MemberAlreadyInClubError,
  UserIsNotModeratorError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
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

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const user3 = generatePrivateKey()

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

describe('Add user to the club', () => {
  it('Adds user to the club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const addResponse = yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        expect(addResponse.newCount).toEqual(2)

        const clubInfo = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(user1))),
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
            },
          })
        )
        expect(clubInfo.clubInfoForUser).toEqual({
          club,
          isModerator: false,
          vexlNotificationToken: Option.none(),
        })
      })
    )
  })

  it('Fails with limit exceeded when adding user to the club that is full', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user2.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        const failedResponse = yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user3.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          }),
          Effect.either
        )

        expectErrorResponse(ClubUserLimitExceededError)(failedResponse)
      })
    )
  })

  it('Fails with memer already in club when adding user to the club that is already in club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        const failedResponse = yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          }),
          Effect.either
        )

        expectErrorResponse(MemberAlreadyInClubError)(failedResponse)
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(nonModeratorMember))),
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: generateClubUuid(),
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Fails with Invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challenge = yield* _(generateAndSignChallenge(userKey))

        const errorResponse = yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
              },
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

  it('Enqueues VexlNotificationToken notifications for club members when user is added', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(clearEnqueuedNotifications)

        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              madeInactiveAt: Option.none(),
              report: 0,
              ...club,
              membersCountLimit: 100,
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

        const user4 = generatePrivateKey()
        const app = yield* _(NodeTestingApp)

        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user4.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)
        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        // 3 notifications: moderator (vexl_nt_test from beforeEach) + user1 + user2
        expect(clubNotifications).toHaveLength(3)
        expect(
          clubNotifications
            .map((n) =>
              n.task._tag === 'NewClubUserNotificationMqEntry'
                ? n.task.token
                : ''
            )
            .sort((a, b) => (a ?? '').localeCompare(b ?? ''))
        ).toEqual(
          [
            'vexl_nt_member1_token',
            'vexl_nt_member2_token',
            'vexl_nt_test',
          ].sort((a, b) => a.localeCompare(b))
        )
      })
    )
  })

  it('Enqueues admission notification for added user with vexlNotificationToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(clearEnqueuedNotifications)

        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.some(
                  'vexl_nt_admitted_user' as VexlNotificationToken
                ),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)
        const admissionNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'UserAdmittedToClubNotificationMqEntry'
        )

        expect(admissionNotifications).toHaveLength(1)
        if (
          admissionNotifications[0]?.task._tag ===
          'UserAdmittedToClubNotificationMqEntry'
        ) {
          expect(admissionNotifications[0].task.token).toBe(
            'vexl_nt_admitted_user'
          )
          expect(admissionNotifications[0].task.publicKey).toBe(
            user1.publicKeyPemBase64
          )
        }
      })
    )
  })

  it('Routes notifications correctly when members have mixed token types', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(clearEnqueuedNotifications)

        const clubDb = yield* _(ClubsDbService)
        yield* _(
          clubDb.updateClub({
            id: clubId,
            data: {
              madeInactiveAt: Option.none(),
              report: 0,
              ...club,
              membersCountLimit: 100,
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

        const user4 = generatePrivateKey()
        const app = yield* _(NodeTestingApp)

        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user4.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
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

        expect(notificationsWithVexlToken).toHaveLength(2)
        expect(
          notificationsWithVexlToken
            .map((n) =>
              n.task._tag === 'NewClubUserNotificationMqEntry'
                ? n.task.token
                : ''
            )
            .sort((a, b) => (a ?? '').localeCompare(b ?? ''))
        ).toEqual(
          ['vexl_nt_member2_token', 'vexl_nt_test'].sort((a, b) =>
            a.localeCompare(b)
          )
        )
      })
    )
  })
})
