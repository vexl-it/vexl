import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {newOfferId} from '@vexl-next/domain/src/general/offers'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Option, Schema} from 'effect'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'

import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ReportClubLimitReachedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {
  type MockedUser,
  createMockedUser,
} from '../../../utils/createMockedUser'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriStringE)('https://some.url')

let user: MockedUser
const clubKeypairForUser = generatePrivateKey()

let user2: MockedUser
const clubKeypairForUser2 = generatePrivateKey()

const club = {
  clubImageUrl: SOME_URL,
  name: 'someName',
  description: Option.some('someDescription'),
  membersCountLimit: 100,
  uuid: generateClubUuid(),
  validUntil: new Date(),
  reportLimit: 2,
}

const offerId = newOfferId()

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))

      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM club_reported_record`)
      yield* _(sql`DELETE FROM club_member`)
      yield* _(sql`DELETE FROM club`)
      yield* _(sql`DELETE FROM club_offer_reported_info`)

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

      const clubDb = yield* _(ClubMembersDbService)
      yield* _(
        clubDb.insertClubMember({
          clubId,
          publicKey: clubKeypairForUser.publicKeyPemBase64,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: 'someToken' as ExpoNotificationToken,
        })
      )

      yield* _(
        clubDb.insertClubMember({
          clubId,
          publicKey: clubKeypairForUser2.publicKeyPemBase64,
          isModerator: false,
          lastRefreshedAt: new Date(),
          notificationToken: 'someToken' as ExpoNotificationToken,
        })
      )
    })
  )
})

describe('Report club', () => {
  it('Should report club for user who is member', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const challenge = yield* _(generateAndSignChallenge(clubKeypairForUser))

        yield* _(
          app.reportClub(
            {
              body: {
                ...challenge,
                offerId,
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          )
        )

        const offerIdHashed = yield* _(hashSha256(offerId))

        const sql = yield* _(SqlClient.SqlClient)

        const clubOfferReportedInfo = yield* _(sql`
          SELECT
            offer_id
          FROM
            club_offer_reported_info
          WHERE
            offer_id = ${offerIdHashed}
        `)
        expect(clubOfferReportedInfo.at(0)).toBeDefined()

        const reportedInDb = yield* _(sql`
          SELECT
            report
          FROM
            club
          WHERE
            UUID = ${club.uuid}
        `)

        expect(reportedInDb.at(0)).toHaveProperty('report', 1)
      })
    )
  })

  it('Should deactivate club after report count limit is exceeded', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const challengeForUser = yield* _(
          generateAndSignChallenge(clubKeypairForUser)
        )
        const challengeForUser2 = yield* _(
          generateAndSignChallenge(clubKeypairForUser2)
        )

        yield* _(
          app.reportClub(
            {
              body: {
                ...challengeForUser,
                offerId,
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          )
        )

        yield* _(
          app.reportClub(
            {
              body: {
                ...challengeForUser2,
                offerId: newOfferId(),
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        const sql = yield* _(SqlClient.SqlClient)

        const inactiveClubInDb = yield* _(sql`
          SELECT
            *
          FROM
            club
          WHERE
            UUID = ${club.uuid}
            AND made_inactive_at IS NOT NULL
        `)

        expect(inactiveClubInDb.at(0)).toBeDefined()
      })
    )
  })

  it('Should not allow to report club twice for the same offer id and should NOT fail', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const challenge = yield* _(generateAndSignChallenge(clubKeypairForUser))

        yield* _(
          app.reportClub(
            {
              body: {
                ...challenge,
                offerId,
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          )
        )

        const sql = yield* _(SqlClient.SqlClient)

        const offerIdHashed = yield* _(hashSha256(offerId))

        const clubOfferReportedInfo = yield* _(sql`
          SELECT
            offer_id
          FROM
            club_offer_reported_info
          WHERE
            offer_id = ${offerIdHashed}
        `)
        expect(clubOfferReportedInfo.at(0)).toBeDefined()

        const reportedInDb = yield* _(sql`
          SELECT
            report
          FROM
            club
          WHERE
            UUID = ${club.uuid}
        `)
        expect(reportedInDb.at(0)).toHaveProperty('report', 1)

        const secondChallenge = yield* _(
          generateAndSignChallenge(clubKeypairForUser)
        )

        const response = yield* _(
          app.reportClub(
            {
              body: {
                ...secondChallenge,
                offerId,
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          ),
          Effect.either
        )

        expect(response._tag).toBe('Right')
        if (response._tag === 'Right') {
          expect(response.right).toEqual({})
        }

        const reportedInDbAfterSecondAttempt = yield* _(sql`
          SELECT
            report
          FROM
            club
          WHERE
            UUID = ${club.uuid}
        `)
        expect(reportedInDbAfterSecondAttempt.at(0)).toHaveProperty('report', 1)
      })
    )
  })

  it('Should not allow to report club for the same user more than configured limit value', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const challenge = yield* _(generateAndSignChallenge(clubKeypairForUser))
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE club
          SET
            report_limit = 10
          WHERE
            UUID = ${club.uuid}
        `)

        yield* _(
          app.reportClub(
            {
              body: {
                ...challenge,
                offerId,
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          )
        )

        const secondChallenge = yield* _(
          generateAndSignChallenge(clubKeypairForUser)
        )

        yield* _(
          app.reportClub(
            {
              body: {
                ...secondChallenge,
                offerId: newOfferId(),
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          )
        )

        const thirdChallenge = yield* _(
          generateAndSignChallenge(clubKeypairForUser)
        )

        yield* _(
          app.reportClub(
            {
              body: {
                ...thirdChallenge,
                offerId: newOfferId(),
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          )
        )

        const fourthChallenge = yield* _(
          generateAndSignChallenge(clubKeypairForUser)
        )

        const errorResponse = yield* _(
          app.reportClub(
            {
              body: {
                ...fourthChallenge,
                offerId: newOfferId(),
                clubUuid: club.uuid,
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          ),
          Effect.either
        )

        expectErrorResponse(ReportClubLimitReachedError)(errorResponse)
      })
    )
  })

  it('Should return 404 when club not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challenge = yield* _(generateAndSignChallenge(clubKeypairForUser))

        const errorResponse = yield* _(
          app.reportClub(
            {
              body: {
                ...challenge,
                offerId,
                clubUuid: generateClubUuid(),
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          ),
          Effect.either
        )

        expect(errorResponse._tag).toBe('Left')
        if (errorResponse._tag === 'Left') {
          expect(errorResponse.left).toHaveProperty('status', 404)
        }
      })
    )
  })

  it('Should return 404 when user not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const challenge = yield* _(generateAndSignChallenge(clubKeypairForUser))

        const errorResponse = yield* _(
          app.reportClub(
            {
              body: {
                ...challenge,
                publicKey: generatePrivateKey().publicKeyPemBase64,
                offerId,
                clubUuid: generateClubUuid(),
              },
            },
            HttpClientRequest.setHeaders(user.authHeaders)
          ),
          Effect.either
        )

        expect(errorResponse._tag).toBe('Left')
        if (errorResponse._tag === 'Left') {
          expect(errorResponse.left).toHaveProperty('status', 400)
        }
      })
    )
  })
})
