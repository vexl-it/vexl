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
import {fromJsDate} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import dayjs from 'dayjs'
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

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      me = yield* _(createMockedUser('+420733333330'))
      user1 = yield* _(createMockedUser('+420733333331'))
      user2 = yield* _(createMockedUser('+420733333332'))

      const client = yield* _(NodeTestingApp)

      const request1: CreateNewOfferRequest = {
        adminId: generateAdminId(),
        countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
        offerPrivateList: [
          {
            payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
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
            payloadPrivate: 'offer2payloadPrivate' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
          },
          {
            payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
            userPublicKey: clubKeypairForMe.publicKeyPemBase64,
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

      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`
        UPDATE offer_private
        SET
          created_at = now() - interval '10 day';
      `)
    })
  )
})

describe('Get club offers by ids', () => {
  it('Returns club offers by ids', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffersById = yield* _(
          client.getClubOffersByIds(
            {
              body: {
                ids: [offer1.offerId, offer2.offerId],
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        expect(
          clubOffersById
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer1.offerId, offer2.offerId].sort().join())
      })
    )
  })

  it('Does not return expired club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffersById = yield* _(
          client.getClubOffersByIds(
            {
              body: {
                ids: [offer1.offerId, offer2.offerId],
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            offer_id = ${offer1.offerId};
        `)

        expect(
          clubOffersById
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Does not return flagged club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer1.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffersById = yield* _(
          client.getClubOffersByIds(
            {
              body: {
                ids: [offer1.offerId, offer2.offerId],
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            offer_id = ${offer1.offerId};
        `)

        expect(clubOffersById.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Does not fail when calling with not existing ids of club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffersById = yield* _(
          client.getClubOffersByIds(
            {
              body: {
                ids: [offer1.offerId, offer2.offerId, newOfferId()],
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        expect(
          clubOffersById
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer1.offerId, offer2.offerId].sort().join())
      })
    )
  })
})

describe('Get club offers for me', () => {
  it('Returns club offers for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffers = yield* _(
          client.getClubOffersForMe(
            {
              body: {
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        expect(
          clubOffers.offers
            .map((o) => o.offerId)
            .sort()
            .join()
        ).toEqual([offer1.offerId, offer2.offerId].sort().join())
      })
    )
  })

  it('Does not return expired club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '7 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffers = yield* _(
          client.getClubOffersForMe(
            {
              body: {
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            offer_id = ${offer1.offerId}
            OR offer_id = ${offer2.offerId};
        `)

        expect(clubOffers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Does not return flagged club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer1.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffers = yield* _(
          client.getClubOffersForMe(
            {
              body: {
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            offer_id = ${offer1.offerId};
        `)

        expect(clubOffers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })
})

describe('Get club offers for me modified or created after', () => {
  it('Returns club offers for me', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter(
            {
              body: {
                modifiedAt,
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW()
          WHERE
            offer_id = ${offer2.offerId};
        `)

        expect(clubOffers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Returns club offers for me that have public parts not modified after but private parts were uploaded after', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '2 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)

        yield* _(sql`
          UPDATE offer_private
          SET
            created_at = NOW()
          WHERE
            id IN (
              SELECT
                offer_private.id
              FROM
                offer_public
                LEFT JOIN offer_private ON offer_public.id = offer_private.offer_id
              WHERE
                offer_public.offer_id = ${offer2.offerId}
            )
        `)

        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(0, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter(
            {
              body: {
                modifiedAt,
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW()
          WHERE
            offer_id = ${offer2.offerId};
        `)

        yield* _(sql`
          UPDATE offer_private
          SET
            created_at = now() - interval '10 day';
        `)

        expect(clubOffers.offers.map((o) => o.offerId).join()).toEqual(
          [offer2.offerId].join()
        )
      })
    )
  })

  it('Does not return expired club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter(
            {
              body: {
                modifiedAt,
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(clubOffers.offers.map((o) => o.offerId)).toEqual([])
      })
    )
  })

  it('Does not return flagged club offers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW() - INTERVAL '3 days'
          WHERE
            offer_id = ${offer1.offerId};
        `)
        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `)
        const client = yield* _(NodeTestingApp)
        const modifiedAt = fromJsDate(dayjs().subtract(2, 'days').toDate())

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        const clubOffers = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfter(
            {
              body: {
                modifiedAt,
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            modified_at = NOW(),
            report = 0
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(clubOffers.offers.map((o) => o.offerId)).toEqual([])
      })
    )
  })
})

describe('Get removed club offers', () => {
  it('Returns removed club offers when offer removed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const request: CreateNewOfferRequest = {
          adminId: generateAdminId(),
          countryPrefix: Schema.decodeSync(CountryPrefixE)(420),
          offerPrivateList: [
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: user1.mainKeyPair.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForUser1.publicKeyPemBase64,
            },
            {
              payloadPrivate: 'payloadPrivate2' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForUser2.publicKeyPemBase64,
            },

            {
              payloadPrivate: 'payloadPrivateForMe' as PrivatePayloadEncrypted,
              userPublicKey: clubKeypairForMe.publicKeyPemBase64,
            },
          ],
          offerType: 'BUY',
          payloadPublic: 'payloadPublic' as PublicPayloadEncrypted,
          offerId: newOfferId(),
        }

        const newOffer = yield* _(
          client.createNewOffer(
            {body: request},
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const offerIds = [newOffer.offerId, offer1.offerId]

        const firstRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const removedClubOffers = yield* _(
          client.getRemovedClubOffers(
            {
              body: {
                publicKey: firstRequestWithChallenge.publicKey,
                signedChallenge: firstRequestWithChallenge.signedChallenge,
                offerIds,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        expect(removedClubOffers.offerIds).toEqual([])

        yield* _(
          client.deleteOffer(
            {query: {adminIds: [newOffer.adminId]}},
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        const secondRequestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const removedClubOffers2 = yield* _(
          client.getRemovedClubOffers(
            {
              body: {
                publicKey: secondRequestWithChallenge.publicKey,
                signedChallenge: secondRequestWithChallenge.signedChallenge,
                offerIds,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        expect(removedClubOffers2.offerIds.join()).toEqual(
          [newOffer.offerId].join()
        )
      })
    )
  })

  it('Returns removed club offers when offer expired', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW() - INTERVAL '8 days'
          WHERE
            offer_id = ${offer2.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const offerIds = [offer1.offerId, offer2.offerId]

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const clubOffers = yield* _(
          client.getRemovedClubOffers(
            {
              body: {
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
                offerIds,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            refreshed_at = NOW()
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(clubOffers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })

  it('Returns deleted club offers when offer flagged', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 3
          WHERE
            offer_id = ${offer2.offerId};
        `)

        const client = yield* _(NodeTestingApp)

        const offerIds = [offer1.offerId, offer2.offerId]

        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )
        const clubOffers = yield* _(
          client.getRemovedClubOffers(
            {
              body: {
                publicKey: requestWithChallenge.publicKey,
                signedChallenge: requestWithChallenge.signedChallenge,
                offerIds,
              },
            },
            HttpClientRequest.setHeaders(me.authHeaders)
          )
        )

        yield* _(sql`
          UPDATE offer_public
          SET
            report = 0
          WHERE
            ${sql.in('offer_id', [offer1.offerId, offer2.offerId])}
        `)

        expect(clubOffers.offerIds.join()).toEqual([offer2.offerId].join())
      })
    )
  })
})
