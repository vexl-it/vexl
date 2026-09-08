import {KeyHolder} from '@vexl-next/cryptography'
import {KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder'
import {
  OfferAdminId,
  OfferPublicPart,
  PublicPayloadEncrypted,
  SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, Schema} from 'effect'
import {aesGCMIgnoreTagEncrypt} from '../utils/crypto'
import decryptOffer from './decryptOffer'
import encryptOfferPublicPayload from './utils/encryptOfferPublicPayload'
import {encryptPrivatePart} from './utils/encryptPrivatePart'

const ownerKeyPair = KeyHolder.generatePrivateKey()
const unusedOwnerKeyPairV2 = Schema.decodeSync(KeyPairV2)({
  publicKey: 'V2_PUB_unused',
  privateKey: 'V2_PRIV_unused',
})
const symmetricKey = Schema.decodeSync(SymmetricKey)('symmetric-key')
const adminId = Schema.decodeSync(OfferAdminId)('admin-id')

const offerPublicPart = Schema.decodeSync(OfferPublicPart)({
  offerPublicKey: ownerKeyPair.publicKeyPemBase64,
  location: [
    {
      placeId: 'osm:1',
      latitude: 50,
      longitude: 14,
      radius: 0.1,
      address: 'Praha, Česko',
      shortAddress: 'Praha',
      localizedAddresses: {
        en: 'Prague, Czechia',
        cs: 'Praha, Česko',
      },
    },
  ],
  offerDescription: 'Offer description',
  amountBottomLimit: 0,
  amountTopLimit: 100,
  feeState: 'WITHOUT_FEE',
  feeAmount: 0,
  locationState: ['IN_PERSON'],
  paymentMethod: ['CASH'],
  btcNetwork: ['ON_CHAIN'],
  currency: 'CZK',
  spokenLanguages: ['ENG'],
  offerType: 'SELL',
  activePriceState: 'NONE',
  activePriceValue: 0,
  activePriceCurrency: 'CZK',
  active: true,
  groupUuids: [],
  listingType: 'BITCOIN',
  authorClientVersion: '1.16.0',
})

async function createServerOffer(
  publicPayload: PublicPayloadEncrypted
): Promise<ServerOffer> {
  const privatePart = await Effect.runPromise(
    encryptPrivatePart({
      toPublicKey: ownerKeyPair.publicKeyPemBase64,
      payloadPrivate: {
        commonFriends: [],
        verifiedCommonFriends: [],
        friendLevel: ['FIRST_DEGREE'],
        symmetricKey,
        clubIds: [],
        adminId,
        intendedConnectionLevel: 'FIRST',
        intendedClubs: [],
      },
    })
  )

  return Schema.decodeSync(ServerOffer)({
    id: 1,
    offerId: 'offer-id',
    publicPayload,
    privatePayload: privatePart.payloadPrivate,
    createdAt: '2026-09-04T00:00:00.000Z',
    modifiedAt: '2026-09-04T00:00:00.000Z',
  })
}

describe('offer location encryption and decryption', () => {
  it('preserves localized addresses through an encrypt-decrypt round trip', async () => {
    const publicPayload = await Effect.runPromise(
      encryptOfferPublicPayload({offerPublicPart, symmetricKey})
    )
    const serverOffer = await createServerOffer(publicPayload)

    const decryptedOffer = await Effect.runPromise(
      decryptOffer(ownerKeyPair, unusedOwnerKeyPairV2)(serverOffer)
    )

    expect(decryptedOffer.publicPart.location[0]?.localizedAddresses).toEqual({
      en: 'Prague, Czechia',
      cs: 'Praha, Česko',
    })
  })

  it('keeps locations when a payload contains malformed localized addresses', async () => {
    const location = offerPublicPart.location[0]
    expect(location).toBeDefined()
    if (location === undefined) return

    const malformedPublicPayload = {
      ...offerPublicPart,
      active: 'true',
      location: [
        JSON.stringify({
          longitude: String(location.longitude),
          latitude: String(location.latitude),
          city: location.shortAddress,
        }),
      ],
      locationV2: [{...location, localizedAddresses: 42}],
      locationState: 'IN_PERSON',
      locationStateV2: offerPublicPart.locationState,
    }
    const encryptedPayload = await Effect.runPromise(
      aesGCMIgnoreTagEncrypt(symmetricKey)(
        JSON.stringify(malformedPublicPayload)
      )
    )
    const publicPayload = Schema.decodeSync(PublicPayloadEncrypted)(
      `0${encryptedPayload}`
    )
    const serverOffer = await createServerOffer(publicPayload)

    const decryptedOffer = await Effect.runPromise(
      decryptOffer(ownerKeyPair, unusedOwnerKeyPairV2)(serverOffer)
    )

    expect(decryptedOffer.publicPart.location).toHaveLength(1)
    expect(decryptedOffer.publicPart.location[0]?.localizedAddresses).toEqual(
      {}
    )
  })
})
