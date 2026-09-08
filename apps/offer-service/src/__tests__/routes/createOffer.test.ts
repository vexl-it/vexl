import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateAdminId,
  newOfferId,
  type PrivatePayloadEncrypted,
  type PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  DuplicatedPublicKeyError,
  MissingOwnerPrivatePartError,
  type CreateNewOfferRequest,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {makeTestCommonAndSecurityHeaders} from '../utils/createMockedUser'
import {makeTestCommonAndSecurityHeadersWithPublicKeyV2} from '../utils/makeTestCommonAndSecurityHeadersWithPublicKeyV2'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('createOffer', () => {
  it('Creates a new offer', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const user1 = generatePrivateKey()
        const user2 = generatePrivateKey()
        const me = generatePrivateKey()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefix)(420),
          offerPrivateList: [
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* NodeTestingApp

        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* client.createNewOffer({
          payload: request,
          headers: commonAndSecurityHeaders,
        })

        expect(response.adminId).toEqual(request.adminId)
        expect(response.offerId).toEqual(request.offerId)
        expect(response.privatePayload).toEqual('0payloadPrivateForMe')
        expect(response.publicPayload).toEqual('payloadPublic')
        expect(response.id).toBeDefined()

        const sql = yield* SqlClient.SqlClient
        const publicPartInDb = yield* sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            offer_id = ${request.offerId ?? ''}
        `
        expect(publicPartInDb).toHaveLength(1)

        const privatePartsDb = yield* sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            offer_id = ${publicPartInDb[0].id ?? ''}
        `
        expect(privatePartsDb).toHaveLength(3)
      })
    )
  })

  it('Fails when creating without owners private part', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const user1 = generatePrivateKey()
        const user2 = generatePrivateKey()
        const me = generatePrivateKey()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefix)(420),
          offerPrivateList: [
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* NodeTestingApp

        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* pipe(
          client.createNewOffer({
            payload: request,
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )

        expectErrorResponse(MissingOwnerPrivatePartError)(response)
      })
    )
  })

  it('Fails when creating with duplicated public key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const user1 = generatePrivateKey()
        const user2 = generatePrivateKey()
        const me = generatePrivateKey()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefix)(420),
          offerPrivateList: [
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: '0payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: user2.publicKeyPemBase64,
            },

            {
              payloadPrivate: '0payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: me.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* NodeTestingApp

        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* pipe(
          client.createNewOffer({
            payload: request,
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )

        expectErrorResponse(DuplicatedPublicKeyError)(response)
      })
    )
  })

  it('Creates a new offer when request includes public key v2 in headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const user1 = generatePrivateKey()
        const me = generatePrivateKey()
        const publicKeyV2 = yield* generateV2KeyPair()

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefix)(420),
          offerPrivateList: [
            {
              payloadPrivate: '0payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.publicKeyPemBase64,
            },
            {
              payloadPrivate:
                '0payloadPrivateForMeV2' as PrivatePayloadEncrypted,
              userPublicKey: publicKeyV2.publicKey,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const client = yield* NodeTestingApp
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          publicKey: me.publicKeyPemBase64,
        })

        yield* setAuthHeaders(authHeaders)
        const commonAndSecurityHeadersWithPublicKeyV2 =
          yield* makeTestCommonAndSecurityHeadersWithPublicKeyV2({
            authHeaders,
            publicKeyV2: publicKeyV2.publicKey,
          })

        const response = yield* client.createNewOffer({
          payload: request,
          headers: commonAndSecurityHeadersWithPublicKeyV2,
        })

        expect(response.offerId).toEqual(request.offerId)
        expect(response.privatePayload).toEqual('0payloadPrivateForMeV2')
      })
    )
  })
})
