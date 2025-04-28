import {HttpClientRequest} from '@effect/platform'
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
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, Schema} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
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

      offer1 = {
        ...(yield* _(
          client.createNewOffer(
            {body: request1},
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
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
          client.createNewOffer(
            {body: request2},
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )),
        adminId: request2.adminId,
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

        yield* _(
          client.reportClubOffer(
            {
              body: {
                offerId: offer1.offerId,
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
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

  it('return 404 when I am reporting offer that is not ment for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const response = yield* _(
          client.reportClubOffer(
            {
              body: {
                offerId: offer2.offerId,
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
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

        const response = yield* _(
          client.reportClubOffer(
            {
              body: {
                offerId: newOfferId(),
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          ),
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
