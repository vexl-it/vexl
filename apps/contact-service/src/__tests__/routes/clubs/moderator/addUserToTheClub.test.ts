import {
  PublicKeyV2,
  generatePrivateKey,
} from '@vexl-next/cryptography/src/KeyHolder'
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
import {Effect, Option, Schema, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
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
const toPublicKeyV2 = (publicKey: string): typeof PublicKeyV2.Type =>
  Schema.decodeSync(PublicKeyV2)(`V2_PUB_${publicKey}`)

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
      yield* sql`DELETE FROM club_member_count_change`
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

describe('Add user to the club', () => {
  it('Adds user to the club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const addResponse = yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
              publicKey: user1.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        expect(addResponse.newCount).toEqual(2)

        const clubInfo = yield* app.ClubsMember.getClubInfo({
          payload: {
            ...(yield* generateAndSignChallenge(user1)),
            notificationToken: Option.none(),
            vexlNotificationToken: Option.none(),
            publicKeyV2: Option.none(),
          },
        })
        expect(clubInfo.clubInfoForUser).toEqual({
          club,
          isModerator: false,
          vexlNotificationToken: Option.none(),
        })

        yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
        const clubs = yield* app.ClubsAdmin.listClubs({
          headers: {'x-admin-token': ADMIN_TOKEN},
        })
        expect(clubs.clubs).toEqual([
          expect.objectContaining({
            uuid: club.uuid,
            membersCount: 2,
            membersJoinedLast30Days: 1,
            membersLeftLast30Days: 0,
          }),
        ])
      })
    )
  })

  it('Fails with limit exceeded when adding user to the club that is full', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
              publicKey: user1.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
              publicKey: user2.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user2.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        const failedResponse = yield* pipe(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user3.publicKeyPemBase64,
                publicKeyV2: toPublicKeyV2(user3.publicKeyPemBase64),
              },
              clubUuid: club.uuid,
              ...(yield* generateAndSignChallenge(userKey)),
            },
          }),
          Effect.result
        )

        expectErrorResponse(ClubUserLimitExceededError)(failedResponse)
      })
    )
  })

  it('Fails with memer already in club when adding user to the club that is already in club', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
              publicKey: user1.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        const failedResponse = yield* pipe(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
                publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
              },
              clubUuid: club.uuid,
              ...(yield* generateAndSignChallenge(userKey)),
            },
          }),
          Effect.result
        )

        expectErrorResponse(MemberAlreadyInClubError)(failedResponse)
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
                publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
              },
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
                publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
              },
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
                publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
              },
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
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                vexlNotificationToken: Option.none(),
                publicKey: user1.publicKeyPemBase64,
                publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
              },
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

  it('Enqueues VexlNotificationToken notifications for club members when user is added', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        yield* clearEnqueuedNotifications

        const clubDb = yield* ClubsDbService
        yield* clubDb.updateClub({
          id: clubId,
          data: {
            madeInactiveAt: Option.none(),
            madeInactiveReason: Option.none(),
            report: 0,
            ...club,
            membersCountLimit: 100,
          },
        })

        const membersDb = yield* ClubMembersDbService
        yield* membersDb.insertClubMember({
          clubId,
          publicKey: user1.publicKeyPemBase64,
          notificationToken: null,
          vexlNotificationToken:
            'vexl_nt_member1_token' as VexlNotificationToken,
          isModerator: false,
          lastRefreshedAt: new Date(),
          publicKeyV2: null,
        })
        yield* membersDb.insertClubMember({
          clubId,
          publicKey: user2.publicKeyPemBase64,
          notificationToken: '2someToken2' as ExpoNotificationToken,
          vexlNotificationToken: null,
          isModerator: false,
          lastRefreshedAt: new Date(),
          publicKeyV2: null,
        })

        yield* membersDb.insertClubMember({
          clubId,
          publicKey: user3.publicKeyPemBase64,
          notificationToken: null,
          vexlNotificationToken:
            'vexl_nt_member2_token' as VexlNotificationToken,
          isModerator: false,
          lastRefreshedAt: new Date(),
          publicKeyV2: null,
        })

        const user4 = generatePrivateKey()
        const app = yield* NodeTestingApp

        yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
              publicKey: user4.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user4.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        yield* Effect.sleep('100 millis')

        const enqueuedNotifications = yield* getEnqueuedNotifications
        const clubNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'NewClubUserNotificationMqEntry'
        )

        // 4 notifications: moderator + 3 existing members with either vexl or expo token.
        expect(clubNotifications).toHaveLength(4)
        expect(
          clubNotifications
            .map((n) =>
              n.task._tag === 'NewClubUserNotificationMqEntry'
                ? n.task.token
                : ''
            )
            .filter((token) => token !== null)
            .sort((a, b) => (a ?? '').localeCompare(b ?? ''))
        ).toEqual(
          [
            'vexl_nt_member1_token',
            'vexl_nt_member2_token',
            'vexl_nt_test',
          ].sort((a, b) => a.localeCompare(b))
        )
        expect(
          clubNotifications
            .map((n) =>
              n.task._tag === 'NewClubUserNotificationMqEntry'
                ? (n.task.notificationToken ?? '')
                : ''
            )
            .filter((notificationToken) => notificationToken !== '')
            .sort((a, b) => a.localeCompare(b))
        ).toEqual(
          ['2someToken2', 'someToken'].sort((a, b) => a.localeCompare(b))
        )
      })
    )
  })

  it('Enqueues admission notification for added user with vexlNotificationToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        yield* clearEnqueuedNotifications

        const app = yield* NodeTestingApp
        yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.some(
                'vexl_nt_admitted_user' as VexlNotificationToken
              ),
              publicKey: user1.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user1.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        yield* Effect.sleep('100 millis')

        const enqueuedNotifications = yield* getEnqueuedNotifications
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
      Effect.gen(function* () {
        yield* clearEnqueuedNotifications

        const clubDb = yield* ClubsDbService
        yield* clubDb.updateClub({
          id: clubId,
          data: {
            madeInactiveAt: Option.none(),
            madeInactiveReason: Option.none(),
            report: 0,
            ...club,
            membersCountLimit: 100,
          },
        })

        const membersDb = yield* ClubMembersDbService

        // Member with ONLY expo token (no vexl token - won't receive notification via new path)
        yield* membersDb.insertClubMember({
          clubId,
          publicKey: user1.publicKeyPemBase64,
          notificationToken: 'expo_only_token' as ExpoNotificationToken,
          vexlNotificationToken: null,
          isModerator: false,
          lastRefreshedAt: new Date(),
          publicKeyV2: null,
        })

        // Member with BOTH expo and vexl token (new path only)
        yield* membersDb.insertClubMember({
          clubId,
          publicKey: user2.publicKeyPemBase64,
          notificationToken: 'expo_token_2' as ExpoNotificationToken,
          vexlNotificationToken:
            'vexl_nt_member2_token' as VexlNotificationToken,
          isModerator: false,
          lastRefreshedAt: new Date(),
          publicKeyV2: null,
        })

        const user4 = generatePrivateKey()
        const app = yield* NodeTestingApp

        yield* app.ClubsModerator.addUserToTheClub({
          payload: {
            adminitionRequest: {
              langCode: 'en',
              notificationToken: Option.none(),
              vexlNotificationToken: Option.none(),
              publicKey: user4.publicKeyPemBase64,
              publicKeyV2: toPublicKeyV2(user4.publicKeyPemBase64),
            },
            clubUuid: club.uuid,
            ...(yield* generateAndSignChallenge(userKey)),
          },
        })

        yield* Effect.sleep('100 millis')

        // Notifications are sent to all members, filter for those with vexlNotificationToken
        const enqueuedNotifications = yield* getEnqueuedNotifications
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
