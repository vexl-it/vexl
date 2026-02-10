import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {AdmitedToClubNetworkNotificationData} from '@vexl-next/domain/src/general/notifications'
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
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
import {type ClubRecordId} from '../../../../db/ClubsDbService/domain'
import {
  ClubNotificationRecord,
  NEW_CLUB_USER_NOTIFICATIONS_KEY,
} from '../../../../utils/NewClubUserNotificationService'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {sendNotificationsMock} from '../../../utils/mockedExpoNotificationService'
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
          publicKeyV2: Option.none(),
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
              publicKeyV2: Option.none(),
            },
          })
        )
        expect(clubInfo.clubInfoForUser).toEqual({
          club,
          isModerator: false,
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
            publicKeyV2: Option.none(),
          })
        )

        const errorResponse = yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
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

  it('Schedules notification for club members', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

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
            notificationToken: '1someToken1' as ExpoNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
            publicKeyV2: Option.none(),
          })
        )
        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user2.publicKeyPemBase64,
            notificationToken: '2someToken2' as ExpoNotificationToken,
            isModerator: false,
            lastRefreshedAt: new Date(),
            publicKeyV2: Option.none(),
          })
        )

        yield* _(
          membersDb.insertClubMember({
            clubId,
            publicKey: user3.publicKeyPemBase64,
            notificationToken: null,
            isModerator: false,
            lastRefreshedAt: new Date(),
            publicKeyV2: Option.none(),
          })
        )

        const user4 = generatePrivateKey()

        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.none(),
                publicKey: user4.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        const redisService = yield* _(RedisService)
        const savedData = yield* _(
          redisService.readAndDeleteSet(ClubNotificationRecord)(
            NEW_CLUB_USER_NOTIFICATIONS_KEY
          )
        )
        expect(savedData).toHaveLength(2)
        expect(
          savedData.map((one) => `${one.token}:${one.clubUuid}`).sort()
        ).toEqual(
          [`1someToken1:${club.uuid}`, `2someToken2:${club.uuid}`].sort()
        )
      })
    )
  })

  it('Sends notification to new user', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        yield* _(
          app.ClubsModerator.addUserToTheClub({
            payload: {
              adminitionRequest: {
                langCode: 'en',
                notificationToken: Option.some(
                  'token' as ExpoNotificationToken
                ),
                publicKey: user1.publicKeyPemBase64,
              },
              clubUuid: club.uuid,
              ...(yield* _(generateAndSignChallenge(userKey))),
            },
          })
        )

        yield* _(Effect.sleep(100))
        expect(sendNotificationsMock).toHaveBeenCalledWith([
          {
            to: ['token'],
            data: new AdmitedToClubNetworkNotificationData({
              trackingId: Option.none(),
              publicKey: user1.publicKeyPemBase64,
            }).toData(),
          },
        ])
      })
    )
  })
})
