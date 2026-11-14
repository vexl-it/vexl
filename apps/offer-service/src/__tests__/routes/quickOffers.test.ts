import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  generateAdminId,
  newOfferId,
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {
  type CreateNewOfferRequest,
  type CreateNewOfferResponse,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, Order, pipe, Schema} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  type MockedContexts,
  runPromiseInMockedEnvironment,
} from '../utils/runPromiseInMockedEnvironment'

const privatePayload = Schema.decodeSync(PrivatePayloadEncrypted)('0payload')
const clubKeypairForMe = generatePrivateKey()

let owner: MockedUser
let me: MockedUser
let classicOffer: CreateNewOfferResponse
let quickOffer: CreateNewOfferResponse

const createOffer = (
  isQuickOffer: boolean | undefined
): Effect.Effect<CreateNewOfferResponse, unknown, MockedContexts> =>
  Effect.gen(function* (_) {
    const client = yield* _(NodeTestingApp)
    const request: CreateNewOfferRequest = {
      adminId: generateAdminId(),
      countryPrefix: Schema.decodeSync(CountryPrefix)(420),
      offerPrivateList: [
        {
          payloadPrivate: privatePayload,
          userPublicKey: owner.mainKeyPair.publicKeyPemBase64,
        },
        {
          payloadPrivate: privatePayload,
          userPublicKey: me.mainKeyPair.publicKeyPemBase64,
        },
        {
          payloadPrivate: privatePayload,
          userPublicKey: clubKeypairForMe.publicKeyPemBase64,
        },
      ],
      offerType: 'BUY',
      payloadPublic: Schema.decodeSync(PublicPayloadEncrypted)('payload'),
      offerId: newOfferId(),
      isQuickOffer,
    }

    yield* _(setAuthHeaders(owner.authHeaders))
    return yield* _(
      client.createNewOffer({
        payload: request,
        headers: makeTestCommonAndSecurityHeaders(owner.authHeaders),
      })
    )
  })

const queryIsQuickOffer = (
  offer: CreateNewOfferResponse
): Effect.Effect<boolean, unknown, MockedContexts> =>
  Effect.gen(function* (_) {
    const sql = yield* _(SqlClient.SqlClient)
    const rows = yield* _(sql`
      SELECT
        is_quick_offer
      FROM
        offer_public
      WHERE
        offer_id = ${offer.offerId}
    `)
    return yield* _(
      Schema.decodeUnknown(
        Schema.Tuple(Schema.Struct({isQuickOffer: Schema.Boolean}))
      )(rows),
      Effect.map(([row]) => row.isQuickOffer)
    )
  })

const offerIdsOf = (
  items: ReadonlyArray<{readonly offerId: string}>
): readonly string[] =>
  pipe(
    items,
    Array.map((one) => one.offerId),
    Array.sort(Order.string)
  )

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      owner = yield* _(createMockedUser('+420733333331'))
      me = yield* _(createMockedUser('+420733333330'))

      classicOffer = yield* _(createOffer(undefined))
      quickOffer = yield* _(createOffer(true))
    })
  )
})

describe('Quick offers', () => {
  it('Stores the quick marker on create and defaults it to false', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        expect(yield* _(queryIsQuickOffer(classicOffer))).toBe(false)
        expect(yield* _(queryIsQuickOffer(quickOffer))).toBe(true)
      })
    )
  })

  it('Does not return quick offers when the client does not ask for them', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const response = yield* _(
          client.getOffersForMeModifiedOrCreatedAfterPaginated({
            urlParams: {limit: 10},
            headers: makeTestCommonAndSecurityHeaders(me.authHeaders),
          })
        )

        expect(offerIdsOf(response.items)).toEqual([classicOffer.offerId])
      })
    )
  })

  it('Returns quick offers when the client asks for them', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const response = yield* _(
          client.getOffersForMeModifiedOrCreatedAfterPaginated({
            urlParams: {limit: 10, includeQuickOffers: true},
            headers: makeTestCommonAndSecurityHeaders(me.authHeaders),
          })
        )

        expect(offerIdsOf(response.items)).toEqual(
          offerIdsOf([classicOffer, quickOffer])
        )
      })
    )
  })

  it('Does not report quick offers as removed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const response = yield* _(
          client.getRemovedOffers({
            payload: {offerIds: [classicOffer.offerId, quickOffer.offerId]},
            headers: makeTestCommonAndSecurityHeaders(me.authHeaders),
          })
        )

        expect(response.offerIds).toEqual([])
      })
    )
  })

  it('Never returns quick offers through the club offers endpoint', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const requestWithChallenge = yield* _(
          addChallengeForKey(clubKeypairForMe, me.authHeaders)({})
        )

        const response = yield* _(
          client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            payload: {
              limit: 10,
              publicKey: requestWithChallenge.publicKey,
              publicKeyV2: Option.none(),
              signedChallenge: requestWithChallenge.signedChallenge,
            },
          })
        )

        expect(offerIdsOf(response.items)).toEqual([classicOffer.offerId])
      })
    )
  })
})
