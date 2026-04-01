/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
  generateAdminId,
  newOfferId,
} from '@vexl-next/domain/src/general/offers'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  DuplicatedPublicKeyError,
  MissingOwnerPrivatePartError,
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {makeTestCommonAndSecurityHeaders} from '../utils/createMockedUser'
import {makeTestCommonAndSecurityHeadersWithPublicKeyV2} from '../utils/makeTestCommonAndSecurityHeadersWithPublicKeyV2'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const me = generatePrivateKey()
let offer1: CreateNewOfferResponse
let commonAndSecurityHeaders: ReturnType<
  typeof makeTestCommonAndSecurityHeaders
>

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefix)(420),
        offerPrivateList: [
          {
            payloadPrivate: '0offer1payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.publicKeyPemBase64,
          },
          {
            payloadPrivate: '0offer1payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: user2.publicKeyPemBase64,
          },

          {
            payloadPrivate:
              '0offer1payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: me.publicKeyPemBase64,
          },
        ],
        offerType: 'BUY',
        payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
        offerId: newOfferId(),
      }

      const authHeaders = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })
      )

      yield* _(setAuthHeaders(authHeaders))

      commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(authHeaders)

      offer1 = {
        ...(yield* _(
          client.createNewOffer({
            payload: request1,
            headers: commonAndSecurityHeaders,
          })
        )),
        adminId: request1.adminId,
      }
    })
  )
})

describe('Update offer', () => {
  it('Updates offer when updating with only public part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const sql = yield* _(SqlClient.SqlClient)
        const initialOfferPublicPayload = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)

        yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublic'
              ),
              offerPrivateList: [],
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const updatedOfferPublicPayload = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)
        expect(updatedOfferPublicPayload.at(0)).toHaveProperty(
          'payloadPublic',
          'newPayloadPublic'
        )
        expect(
          Number(updatedOfferPublicPayload.at(0)?.updateCounter)
        ).toBeGreaterThan(
          Number(initialOfferPublicPayload.at(0)?.updateCounter)
        )
      })
    )
  })
  it('Updates offer when updating with public and private parts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublic2'
              ),
              offerPrivateList: [
                {
                  userPublicKey: user1.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
                {
                  userPublicKey: me.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2ForMe'),
                },
              ],
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const updatedOfferPublicPayload = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            offer_id = ${offer1.offerId}
        `)
        expect(updatedOfferPublicPayload.at(0)).toHaveProperty(
          'payloadPublic',
          'newPayloadPublic2'
        )

        const updatedOfferPrivatePayload = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            offer_id = ${updatedOfferPublicPayload.at(0)!.id}
            AND user_public_key = ${user1.publicKeyPemBase64}
        `)

        expect(updatedOfferPrivatePayload.at(0)).toHaveProperty(
          'payloadPrivate',
          '0newPayloadPrivate2'
        )
      })
    )
  })
  it('Fails when updating without owners private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublic2'
              ),
              offerPrivateList: [
                {
                  userPublicKey: user1.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
              ],
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(MissingOwnerPrivatePartError)(response)
      })
    )
  })
  it('Fails when updating with duplicated public key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublic2'
              ),
              offerPrivateList: [
                {
                  userPublicKey: user1.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
                {
                  userPublicKey: user1.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
                {
                  userPublicKey: me.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
              ],
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(DuplicatedPublicKeyError)(response)
      })
    )
  })
  it('return 404 when offer not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const data = yield* _(
          client.updateOffer({
            payload: {
              adminId: generateAdminId(),
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublic2'
              ),
              offerPrivateList: [
                {
                  userPublicKey: user1.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
                {
                  userPublicKey: me.publicKeyPemBase64,
                  payloadPrivate: Schema.decodeUnknownSync(
                    PrivatePayloadEncrypted
                  )('0newPayloadPrivate2'),
                },
              ],
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expect(data._tag).toBe('Left')
        if (data._tag === 'Left') {
          expect(data.left).toHaveProperty('status', 404)
        }
      })
    )
  })

  it('Does not fail when updating expired or flagged offer', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days',
            report = 3
          WHERE
            offer_id = ${offer1.offerId}
        `)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const result = yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublic'
              ),
              offerPrivateList: [],
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW(),
            report = 0
          WHERE
            offer_id = ${offer1.offerId}
        `)

        expect(result._tag).toBe('Right')
      })
    )
  })

  it('Updates offer when visibility is through public key v2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)
        const publicKeyV2 = yield* _(generateV2KeyPair())

        yield* _(sql`
          UPDATE offer_private
          SET
            user_public_key = ${publicKeyV2.publicKey}
          WHERE
            id IN (
              SELECT
                offer_private.id
              FROM
                offer_public
                LEFT JOIN offer_private ON offer_public.id = offer_private.offer_id
              WHERE
                offer_public.offer_id = ${offer1.offerId}
                AND offer_private.user_public_key = ${me.publicKeyPemBase64}
            );
        `)

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            publicKey: me.publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeadersWithPublicKeyV2 = yield* _(
          makeTestCommonAndSecurityHeadersWithPublicKeyV2({
            authHeaders,
            publicKeyV2: publicKeyV2.publicKey,
          })
        )

        const response = yield* _(
          client.updateOffer({
            payload: {
              adminId: offer1.adminId,
              payloadPublic: Schema.decodeUnknownSync(PublicPayloadEncrypted)(
                'newPayloadPublicFromV2'
              ),
              offerPrivateList: [],
            },
            headers: commonAndSecurityHeadersWithPublicKeyV2,
          })
        )

        expect(response.publicPayload).toEqual('newPayloadPublicFromV2')
      })
    )
  })
})
