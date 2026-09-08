import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateClubUuid} from '@vexl-next/domain/src/general/clubs'
import {newOfferId} from '@vexl-next/domain/src/general/offers'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Option, Schema, pipe} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {ClubMembersDbService} from '../../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../../db/ClubsDbService'

import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidChallengeError} from '@vexl-next/rest-api/src/challenges/contracts'
import {ReportClubLimitReachedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {makeTestCommonAndSecurityHeaders} from '../../../routes/contacts/utils'
import {
  type MockedUser,
  createMockedUser,
} from '../../../utils/createMockedUser'
import {generateAndSignChallenge} from '../../../utils/generateAndSignChallenge'
import {NodeTestingApp} from '../../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../../utils/runPromiseInMockedEnvironment'

const ADMIN_TOKEN = 'dev'
const SOME_URL = Schema.decodeSync(UriString)('https://some.url')

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
  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
  reportLimit: 2,
}

const offerId = newOfferId()

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      user = yield* createMockedUser('+420733333330')
      user2 = yield* createMockedUser('+420733333331')

      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM club_reported_record`
      yield* sql`DELETE FROM club_member`
      yield* sql`DELETE FROM club`
      yield* sql`DELETE FROM club_offer_reported_info`

      const app = yield* NodeTestingApp
      yield* addTestHeaders({'x-admin-token': ADMIN_TOKEN})
      yield* app.ClubsAdmin.createClub({
        headers: {'x-admin-token': ADMIN_TOKEN},
        payload: {
          club,
        },
      })

      const clubsDb = yield* ClubsDbService
      const {id: clubId} = yield* pipe(
        clubsDb.findClubByUuid({uuid: club.uuid}),
        Effect.flatMap(Effect.fromOption)
      )

      const clubDb = yield* ClubMembersDbService
      yield* clubDb.insertClubMember({
        clubId,
        publicKey: clubKeypairForUser.publicKeyPemBase64,
        isModerator: false,
        lastRefreshedAt: new Date(),
        notificationToken: 'someToken' as ExpoNotificationToken,
        vexlNotificationToken: 'vexl_nt_test' as VexlNotificationToken,
        publicKeyV2: null,
      })

      yield* clubDb.insertClubMember({
        clubId,
        publicKey: clubKeypairForUser2.publicKeyPemBase64,
        isModerator: false,
        lastRefreshedAt: new Date(),
        notificationToken: 'someToken' as ExpoNotificationToken,
        vexlNotificationToken: 'vexl_nt_test' as VexlNotificationToken,
        publicKeyV2: null,
      })
    })
  )
})

describe('Report club', () => {
  it('Should report club for user who is member', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const challenge = yield* generateAndSignChallenge(clubKeypairForUser)

        yield* addTestHeaders(user.authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user.authHeaders
        )
        yield* app.ClubsMember.reportClub({
          payload: {
            ...challenge,
            offerId,
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders,
        })

        const offerIdHashed = yield* hashSha256(offerId)

        const sql = yield* SqlClient.SqlClient

        const clubOfferReportedInfo = yield* sql`
          SELECT
            offer_id
          FROM
            club_offer_reported_info
          WHERE
            offer_id = ${offerIdHashed}
        `
        expect(clubOfferReportedInfo.at(0)).toBeDefined()

        const reportedInDb = yield* sql`
          SELECT
            report
          FROM
            club
          WHERE
            UUID = ${club.uuid}
        `

        expect(reportedInDb.at(0)).toHaveProperty('report', 1)
      })
    )
  })

  it('Should deactivate club after report count limit is exceeded', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const challengeForUser =
          yield* generateAndSignChallenge(clubKeypairForUser)
        const challengeForUser2 =
          yield* generateAndSignChallenge(clubKeypairForUser2)

        yield* addTestHeaders(user.authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user.authHeaders
        )
        yield* app.ClubsMember.reportClub({
          payload: {
            ...challengeForUser,
            offerId,
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders,
        })

        yield* addTestHeaders(user2.authHeaders)
        const commonAndSecurityHeaders2 = makeTestCommonAndSecurityHeaders(
          user2.authHeaders
        )
        yield* app.ClubsMember.reportClub({
          payload: {
            ...challengeForUser2,
            offerId: newOfferId(),
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders2,
        })

        const sql = yield* SqlClient.SqlClient

        const inactiveClubInDb = yield* sql`
          SELECT
            *
          FROM
            club
          WHERE
            UUID = ${club.uuid}
            AND made_inactive_at IS NOT NULL
        `

        expect(inactiveClubInDb.at(0)).toBeDefined()
        expect(inactiveClubInDb.at(0)).toHaveProperty(
          'madeInactiveReason',
          'FLAGGED'
        )
      })
    )
  })

  it('Should not allow to report club twice for the same offer id and should NOT fail', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const challenge = yield* generateAndSignChallenge(clubKeypairForUser)

        yield* addTestHeaders(user.authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user.authHeaders
        )
        yield* app.ClubsMember.reportClub({
          payload: {
            ...challenge,
            offerId,
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders,
        })

        const sql = yield* SqlClient.SqlClient

        const offerIdHashed = yield* hashSha256(offerId)

        const clubOfferReportedInfo = yield* sql`
          SELECT
            offer_id
          FROM
            club_offer_reported_info
          WHERE
            offer_id = ${offerIdHashed}
        `
        expect(clubOfferReportedInfo.at(0)).toBeDefined()

        const reportedInDb = yield* sql`
          SELECT
            report
          FROM
            club
          WHERE
            UUID = ${club.uuid}
        `
        expect(reportedInDb.at(0)).toHaveProperty('report', 1)

        const secondChallenge =
          yield* generateAndSignChallenge(clubKeypairForUser)

        const response = yield* pipe(
          app.ClubsMember.reportClub({
            payload: {
              ...secondChallenge,
              offerId,
              clubUuid: club.uuid,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )

        expect(response._tag).toBe('Success')
        if (response._tag === 'Success') {
          expect(response.success).toEqual({})
        }

        const reportedInDbAfterSecondAttempt = yield* sql`
          SELECT
            report
          FROM
            club
          WHERE
            UUID = ${club.uuid}
        `
        expect(reportedInDbAfterSecondAttempt.at(0)).toHaveProperty('report', 1)
      })
    )
  })

  it('Should not allow to report club for the same user more than configured limit value', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const challenge = yield* generateAndSignChallenge(clubKeypairForUser)
        const sql = yield* SqlClient.SqlClient

        yield* sql`
          UPDATE club
          SET
            report_limit = 10
          WHERE
            UUID = ${club.uuid}
        `

        yield* addTestHeaders(user.authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user.authHeaders
        )
        yield* app.ClubsMember.reportClub({
          payload: {
            ...challenge,
            offerId,
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders,
        })

        const secondChallenge =
          yield* generateAndSignChallenge(clubKeypairForUser)

        yield* addTestHeaders(user.authHeaders)
        yield* app.ClubsMember.reportClub({
          payload: {
            ...secondChallenge,
            offerId: newOfferId(),
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders,
        })

        const thirdChallenge =
          yield* generateAndSignChallenge(clubKeypairForUser)

        yield* app.ClubsMember.reportClub({
          payload: {
            ...thirdChallenge,
            offerId: newOfferId(),
            clubUuid: club.uuid,
          },
          headers: commonAndSecurityHeaders,
        })

        const fourthChallenge =
          yield* generateAndSignChallenge(clubKeypairForUser)

        yield* addTestHeaders(user.authHeaders)
        const errorResponse = yield* pipe(
          app.ClubsMember.reportClub({
            payload: {
              ...fourthChallenge,
              offerId: newOfferId(),
              clubUuid: club.uuid,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )

        expectErrorResponse(ReportClubLimitReachedError)(errorResponse)
      })
    )
  })

  it('Should return 404 when club not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge(clubKeypairForUser)

        yield* addTestHeaders(user.authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user.authHeaders
        )
        const errorResponse = yield* pipe(
          app.ClubsMember.reportClub({
            payload: {
              ...challenge,
              offerId,
              clubUuid: generateClubUuid(),
            },
            headers: commonAndSecurityHeaders,
            responseMode: 'decoded-and-response',
          }),
          Effect.result
        )

        expectErrorResponse(NotFoundError)(errorResponse)
      })
    )
  })

  it('Should return 404 when user not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge(clubKeypairForUser)

        yield* addTestHeaders(user.authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user.authHeaders
        )
        const errorResponse = yield* pipe(
          app.ClubsMember.reportClub({
            payload: {
              ...challenge,
              publicKey: generatePrivateKey().publicKeyPemBase64,
              offerId,
              clubUuid: generateClubUuid(),
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )

        expectErrorResponse(InvalidChallengeError)(errorResponse)
      })
    )
  })
})
