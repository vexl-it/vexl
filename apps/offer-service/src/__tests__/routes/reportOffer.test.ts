/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
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
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {makeTestCommonAndSecurityHeaders} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const me = generatePrivateKey()
let offer1: CreateNewOfferResponse
let offer2: CreateNewOfferResponse
let offer3: CreateNewOfferResponse
let commonAndSecurityHeadersForMe: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>
let commonAndSecurityHeadersForUser2: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },
          {
            payloadPrivate:
              'offer1payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      const authHeadersForMe = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })
      )

      yield* _(setAuthHeaders(authHeadersForMe))

      commonAndSecurityHeadersForMe =
        makeTestCommonAndSecurityHeaders(authHeadersForMe)

      offer1 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request1,
            headers: commonAndSecurityHeadersForMe,
          })
        )),
        adminId: request1.adminId,
      }

      const request2: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      const authHeadersForUser2 = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333332'),
          publicKey: user2.publicKeyPemBase64,
        })
      )

      yield* _(setAuthHeaders(authHeadersForUser2))

      commonAndSecurityHeadersForUser2 =
        makeTestCommonAndSecurityHeaders(authHeadersForUser2)

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
            payloadPrivate: 'offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      yield* _(setAuthHeaders(authHeadersForUser2))

      offer3 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request3,
            headers: commonAndSecurityHeadersForUser2,
          })
        )),
        adminId: request2.adminId,
      }
    })
  )
})

describe('Report offer', () => {
  it('Properly increases report counter', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        yield* _(
          client.reportOffer({
            payload: {
              offerId: offer1.offerId,
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

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: user1.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        yield* _(
          client.reportOffer({
            payload: {
              offerId: offer1.offerId,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(
          client.reportOffer({
            payload: {
              offerId: offer2.offerId,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const errorResponse = yield* _(
          client.reportOffer({
            payload: {
              offerId: offer3.offerId,
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(ReportOfferLimitReachedError)(errorResponse)
      })
    )
  })

  it('return 404 the when offer is not meant for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.reportOffer({
            payload: {
              offerId: offer2.offerId,
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

  it('Returns 404 when offer does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.reportOffer({
            payload: {
              offerId: newOfferId(),
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
