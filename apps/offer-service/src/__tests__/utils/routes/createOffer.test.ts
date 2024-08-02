import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
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
  DuplicatedPublicKeyError,
  MissingOwnerPrivatePartError,
  type CreateNewOfferRequest,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Either} from 'effect'
import {NodeTestingApp} from '../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../runPromiseInMockedEnvironment'

describe('createOffer', () => {
  it('Creates a new offer', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const user1 = generatePrivateKey()
        const user2 = generatePrivateKey()
        const me = generatePrivateKey()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
          offerPrivateList: [
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.createNewOffer(
            {body: request},
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

        expect(response.adminId).toEqual(request.adminId)
        expect(response.offerId).toEqual(request.offerId)
        expect(response.privatePayload).toEqual('payloadPrivateForMe')
        expect(response.publicPayload).toEqual('payloadPublic')
        expect(response.id).toBeDefined()

        const sql = yield* _(SqlClient.SqlClient)
        const publicPartInDb = yield* _(sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            offer_id = ${request.offerId ?? ''}
        `)
        expect(publicPartInDb).toHaveLength(1)

        const privatePartsDb = yield* _(sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            offer_id = ${publicPartInDb[0].id ?? ''}
        `)
        expect(privatePartsDb).toHaveLength(3)
      })
    )
  })

  it('Fails when creating without owners private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const user1 = generatePrivateKey()
        const user2 = generatePrivateKey()
        const me = generatePrivateKey()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
          offerPrivateList: [
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.createNewOffer(
            {body: request},
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

        expect(response._tag).toEqual('Left')
        if (!Either.isLeft(response)) return
        expect(
          Schema.decodeUnknownEither(MissingOwnerPrivatePartError)(
            response.left.error
          )._tag
        ).toEqual('Right')
      })
    )
  })

  it('Fails when creating with duplicated public key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const user1 = generatePrivateKey()
        const user2 = generatePrivateKey()
        const me = generatePrivateKey()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
          offerPrivateList: [
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.createNewOffer(
            {body: request},
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
        expect(response._tag).toEqual('Left')
        if (!Either.isLeft(response)) return
        expect(
          Schema.decodeUnknownEither(DuplicatedPublicKeyError)(
            response.left.error
          )._tag
        ).toEqual('Right')
      })
    )
  })
})
