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
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'
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
      const {id: clubId} = yield* _(
        clubsDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatten
      )

      const clubDb = yield* _(ClubMembersDbService)
      yield* _(
        clubDb.insertClubMember({
          clubId,
          publicKey: userKey.publicKeyPemBase64,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: 'someToken' as ExpoNotificationToken,
          vexlNotificationToken: 'vexl_nt_test' as VexlNotificationToken,
        })
      )
    })
  )
})

describe('Get club info', () => {
  it('Should return club info', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const result = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          })
        )

        expect(result.clubInfoForUser).toEqual({
          club,
          isModerator: false,
          vexlNotificationToken: Option.some(
            'vexl_nt_test' as VexlNotificationToken
          ),
        })
      })
    )
  })

  it('Correctly updates notification token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken2' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          })
        )

        const data = yield* _(
          SqlClient.SqlClient,
          Effect.flatMap(
            (sql) => sql`
              SELECT
                *
              FROM
                club_member
              WHERE
                notification_token = 'someToken2'
            `
          )
        )
        expect(data.length).toBe(1)
      })
    )
  })

  it('Correctly updates vexl notification token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.some(
                'vexl_nt_updated' as VexlNotificationToken
              ),
            },
          })
        )

        const data = yield* _(
          SqlClient.SqlClient,
          Effect.flatMap(
            (sql) => sql`
              SELECT
                *
              FROM
                club_member
              WHERE
                vexl_notification_token = 'vexl_nt_updated'
            `
          )
        )
        expect(data.length).toBe(1)
      })
    )
  })

  it('Does not clear vexl notification token when Option.none() is provided', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          })
        )

        const data = yield* _(
          SqlClient.SqlClient,
          Effect.flatMap(
            (sql) => sql`
              SELECT
                *
              FROM
                club_member
              WHERE
                vexl_notification_token = 'vexl_nt_test'
                AND public_key = ${userKey.publicKeyPemBase64}
            `
          )
        )
        expect(data.length).toBe(1)
      })
    )
  })

  it('Should return 404 when club is inactive', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE club
          SET
            made_inactive_at = (now() - interval '1 DAY')::date
          WHERE
            UUID = ${club.uuid}
        `)

        const errorResponse = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          }),
          Effect.either
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Should return 404 when club not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const errorResponse = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(generatePrivateKey()))),
              notificationToken: Option.some(
                'someToken2' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          }),
          Effect.either
        )
        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Should return club info when user is admin', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE club_member
          SET
            is_moderator = TRUE
          WHERE
            notification_token = 'someToken'
        `)
        const app = yield* _(NodeTestingApp)

        const result = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              ...(yield* _(generateAndSignChallenge(userKey))),
              notificationToken: Option.some(
                'someToken' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          })
        )

        expect(result.clubInfoForUser).toEqual({
          club,
          isModerator: true,
          vexlNotificationToken: Option.some(
            'vexl_nt_test' as VexlNotificationToken
          ),
        })
      })
    )
  })

  it('Should return error when bad challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const signedChallenge = yield* _(generateAndSignChallenge(userKey))
        const errorResponse = yield* _(
          app.ClubsMember.getClubInfo({
            payload: {
              publicKey: signedChallenge.publicKey,
              signedChallenge: {
                ...signedChallenge.signedChallenge,
                challenge: 'badChallenge' as SignedChallenge['challenge'],
              },
              notificationToken: Option.some(
                'someToken2' as ExpoNotificationToken
              ),
              vexlNotificationToken: Option.none(),
            },
          }),
          Effect.either
        )
        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
})
