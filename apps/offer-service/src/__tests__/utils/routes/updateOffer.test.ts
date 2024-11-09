/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateAdminId,
  newOfferId,
  PrivatePayloadEncryptedE,
  PublicPayloadEncryptedE,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {
  DuplicatedPublicKeyError,
  MissingOwnerPrivatePartError,
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../runPromiseInMockedEnvironment'

const user1 = generatePrivateKey()
const user2 = generatePrivateKey()
const me = generatePrivateKey()
let offer1: CreateNewOfferResponse

beforeAll(async () => {
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

      offer1 = {
        ...(yield* _(
          client.createNewOffer(
            {body: request1},
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
        yield* _(
          client.updateOffer(
            {
              body: {
                adminId: offer1.adminId,
                payloadPublic: Schema.decodeUnknownSync(
                  PublicPayloadEncryptedE
                )('newPayloadPublic'),
                offerPrivateList: [],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
          'newPayloadPublic'
        )
      })
    )
  })
  it('Updates offer when updating with public and private parts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(
          client.updateOffer(
            {
              body: {
                adminId: offer1.adminId,
                payloadPublic: Schema.decodeUnknownSync(
                  PublicPayloadEncryptedE
                )('newPayloadPublic2'),
                offerPrivateList: [
                  {
                    userPublicKey: user1.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                  {
                    userPublicKey: me.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2ForMe'),
                  },
                ],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          )
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
          'newPayloadPrivate2'
        )
      })
    )
  })
  it('Fails when updating without owners private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.updateOffer(
            {
              body: {
                adminId: offer1.adminId,
                payloadPublic: Schema.decodeUnknownSync(
                  PublicPayloadEncryptedE
                )('newPayloadPublic2'),
                offerPrivateList: [
                  {
                    userPublicKey: user1.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                ],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          ),
          Effect.either
        )

        expect(response._tag).toBe('Left')
        if (response._tag === 'Left') {
          expect(
            Schema.decodeUnknownEither(MissingOwnerPrivatePartError)(
              response.left.error
            )
          ).toHaveProperty('_tag', 'Right')
        }
      })
    )
  })
  it('Fails when updating with duplicated public key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.updateOffer(
            {
              body: {
                adminId: offer1.adminId,
                payloadPublic: Schema.decodeUnknownSync(
                  PublicPayloadEncryptedE
                )('newPayloadPublic2'),
                offerPrivateList: [
                  {
                    userPublicKey: user1.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                  {
                    userPublicKey: user1.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                  {
                    userPublicKey: me.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                ],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          ),
          Effect.either
        )

        expect(response._tag).toBe('Left')
        if (response._tag === 'Left') {
          expect(
            Schema.decodeUnknownEither(DuplicatedPublicKeyError)(
              response.left.error
            )
          ).toHaveProperty('_tag', 'Right')
        }
      })
    )
  })
  it('return 404 when offer not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const data = yield* _(
          client.updateOffer(
            {
              body: {
                adminId: generateAdminId(),
                payloadPublic: Schema.decodeUnknownSync(
                  PublicPayloadEncryptedE
                )('newPayloadPublic2'),
                offerPrivateList: [
                  {
                    userPublicKey: user1.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                  {
                    userPublicKey: me.publicKeyPemBase64,
                    payloadPrivate: Schema.decodeUnknownSync(
                      PrivatePayloadEncryptedE
                    )('newPayloadPrivate2'),
                  },
                ],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          ),
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

        const result = yield* _(
          client.updateOffer(
            {
              body: {
                adminId: offer1.adminId,
                payloadPublic: Schema.decodeUnknownSync(
                  PublicPayloadEncryptedE
                )('newPayloadPublic'),
                offerPrivateList: [],
              },
            },
            HttpClientRequest.setHeaders(
              yield* _(
                createDummyAuthHeadersForUser({
                  phoneNumber:
                    Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
                  publicKey: me.publicKeyPemBase64,
                })
              )
            )
          ),
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
})
