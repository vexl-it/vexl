/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateAdminId,
  newOfferId,
  PrivatePayloadEncryptedE,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {
  CanNotDeletePrivatePartOfAuthor,
  DuplicatedPublicKeyError,
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect} from 'effect'
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

describe('Create private part', () => {
  it('Creates private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )
        const userPublicKey = generatePrivateKey().publicKeyPemBase64
        yield* _(
          client.createPrivatePart(
            {
              body: {
                adminId: offer1.adminId,
                offerPrivateList: [
                  {
                    payloadPrivate,
                    userPublicKey,
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
        const privatePartInDb = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            user_public_key = ${userPublicKey}
            AND payload_private = ${payloadPrivate}
        `)

        expect(privatePartInDb.at(0)).toBeTruthy()
      })
    )
  })

  it('Returns proper error when trying to create with duplicates', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )
        const userPublicKey = generatePrivateKey().publicKeyPemBase64
        const result = yield* _(
          client.createPrivatePart(
            {
              body: {
                adminId: offer1.adminId,
                offerPrivateList: [
                  {
                    payloadPrivate,
                    userPublicKey,
                  },
                  {
                    payloadPrivate,
                    userPublicKey,
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

        expect(result._tag === 'Left')
        if (result._tag === 'Left') {
          expect(result.left).toHaveProperty('status', 400)
          expect(
            Schema.decodeUnknownEither(DuplicatedPublicKeyError)(
              result.left.error
            )
          ).toHaveProperty('_tag', 'Right')
        }
      })
    )
  })

  it('Removes old private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )
        yield* _(
          client.createPrivatePart(
            {
              body: {
                adminId: offer1.adminId,
                offerPrivateList: [
                  {
                    payloadPrivate,
                    userPublicKey: user1.publicKeyPemBase64,
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
        const privatePartInDb = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            user_public_key = ${user1.publicKeyPemBase64}
            AND payload_private = ${payloadPrivate}
        `)

        expect(privatePartInDb.at(0)).toBeTruthy()
      })
    )
  })

  it('Does fail with not found when trying to add private part to offer that does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const payloadPrivate = Schema.decodeSync(PrivatePayloadEncryptedE)(
          'addedPrivatePayload'
        )
        const result = yield* _(
          client.createPrivatePart(
            {
              body: {
                adminId: generateAdminId(),
                offerPrivateList: [
                  {
                    payloadPrivate,
                    userPublicKey: user1.publicKeyPemBase64,
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

        expect(result._tag).toBe('Left')
        if (result._tag === 'Left') {
          expect(result.left).toHaveProperty('status', 404)
        }
      })
    )
  })
})

describe('Delete private part', () => {
  it('Deletes private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(
          client.deletePrivatePart(
            {
              body: {
                adminIds: [offer1.adminId],
                publicKeys: [user1.publicKeyPemBase64],
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
        const result = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            user_public_key = ${user1.publicKeyPemBase64}
            AND payload_private = 'offer1payloadPrivate'
        `)
        expect(result.at(0)).toBeFalsy()
      })
    )
  })
  it('Can not delete private part for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.deletePrivatePart(
            {
              body: {
                adminIds: [offer1.adminId],
                publicKeys: [me.publicKeyPemBase64],
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
            Schema.decodeUnknownEither(CanNotDeletePrivatePartOfAuthor)(
              response.left.error
            )
          ).toHaveProperty('_tag', 'Right')
        }
      })
    )
  })
})
