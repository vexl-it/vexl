import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  generateAdminId,
  newOfferId,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {
  ReportOfferLimitReachedError,
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
const clubKeypairForUser1 = generatePrivateKey()
let user2: MockedUser
const clubKeypairForUser2 = generatePrivateKey()
let me: MockedUser
const clubKeypairForMe = generatePrivateKey()
let offer1: CreateNewOfferResponse
let offer2: CreateNewOfferResponse
let offer3: CreateNewOfferResponse
let commonAndSecurityHeadersForUser2: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      me = yield* _(createMockedUser('+420733333330'))
      user1 = yield* _(createMockedUser('+420733333331'))
      user2 = yield* _(createMockedUser('+420733333332'))

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate:
              'offer1payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(user2.authHeaders))

      commonAndSecurityHeadersForUser2 = makeTestCommonAndSecurityHeaders(
        user2.authHeaders
      )

      offer1 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request1,
            headers: commonAndSecurityHeadersForUser2,
          })
        )),
        adminId: request1.adminId,
      }

      const request2: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer2payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer2 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request2,
            headers: commonAndSecurityHeadersForUser2,
          })
        )),
        adminId: request2.adminId,
      }

      const request3: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer2payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.mainKeyPair.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      offer3 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request3,
            headers: commonAndSecurityHeadersForUser2,
          })
        )),
        adminId: request3.adminId,
      }
    })
  )
})

describe('Report club offer', () => {
  it('Should properly increase report counter', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        yield* _(
          client.reportClubOffer({
            payload: {
              offerId: offer1.offerId,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const reportedInDb = yield* _(sql`
          SELECT
            report
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)
        expect(reportedInDb.at(0)).toHaveProperty('report', 1)
      })
    )
  })

  it('Returns error when report limit is reached', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForUser1, user1.authHeaders)({})
        )

        yield* _(setAuthHeaders(user1.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          user1.authHeaders
        )

        yield* _(
          client.reportClubOffer({
            payload: {
              offerId: offer1.offerId,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const secondRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForUser1, user1.authHeaders)({})
        )

        yield* _(
          client.reportClubOffer({
            payload: {
              offerId: offer2.offerId,
              publicKey: secondRequestWithChallenge.publicKey,
              signedChallenge: secondRequestWithChallenge.signedChallenge,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const thirdRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForUser1, user1.authHeaders)({})
        )

        const errorResponse = yield* _(
          client.reportClubOffer({
            payload: {
              offerId: offer3.offerId,
              publicKey: thirdRequestWithChallenge.publicKey,
              signedChallenge: thirdRequestWithChallenge.signedChallenge,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(ReportOfferLimitReachedError)(errorResponse)
      })
    )
  })

  it('return 404 when I am reporting offer that is not ment for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const response = yield* _(
          client.reportClubOffer({
            payload: {
              offerId: offer2.offerId,
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expect(response._tag).toBe('Left')
        if (response._tag === 'Left') {
          expect(response.left).toHaveProperty('status', 404)
        }

        const sql = yield* _(SqlClient.SqlClient)
        const reportedInDb = yield* _(sql`
          SELECT
            report
          FROM
            offer_public
          WHERE
            offer_id = ${offer2.offerId}
        `)
        expect(reportedInDb.at(0)).toHaveProperty('report', 0)
      })
    )
  })

  it('Returns 404 when reporting offer that does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const response = yield* _(
          client.reportClubOffer({
            payload: {
              offerId: newOfferId(),
              publicKey: requestWithChallenge.publicKey,
              signedChallenge: requestWithChallenge.signedChallenge,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expect(response._tag).toBe('Left')
        if (response._tag === 'Left') {
          expect(response.left).toHaveProperty('status', 404)
        }
      })
    )
  })
})
