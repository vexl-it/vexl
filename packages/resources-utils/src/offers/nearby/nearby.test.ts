import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {privatePemToRaw} from '@vexl-next/cryptography/src/KeyHolder/keyUtils'
import {
  generateAdminId,
  newOfferId,
  type OfferPublicPart,
} from '@vexl-next/domain/src/general/offers'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, Schema} from 'effect'
import {createTestOfferApi} from '../../testUtils/offerApi'
import encryptOfferPublicPayload from '../utils/encryptOfferPublicPayload'
import generateSymmetricKey from '../utils/generateSymmetricKey'
import {fetchNearbyOffer} from './fetchNearbyOffer'
import {generateNearbyKey, nearbyKeyToKeyPair} from './nearbyKey'
import {enableNearbySharing} from './nearbySharing'

const publicPart: OfferPublicPart = {
  offerPublicKey: generatePrivateKey().publicKeyPemBase64,
  location: [],
  offerDescription: 'nearby offer',
  amountBottomLimit: 1,
  amountTopLimit: 2,
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
  authorClientVersion: Schema.decodeSync(VersionString)('26.10.0'),
}

it('nearby key roundtrips to a key pair with the same 32-byte scalar', () => {
  const nearbyKey = generateNearbyKey()
  const keyPair = nearbyKeyToKeyPair(nearbyKey)

  const raw = privatePemToRaw(keyPair.privateKeyPemBase64).privateKey
  expect(Buffer.from(nearbyKey, 'base64')).toHaveLength(32)
  expect(raw.toString('hex').padStart(64, '0')).toBe(
    Buffer.from(nearbyKey, 'base64').toString('hex')
  )
  expect(nearbyKeyToKeyPair(nearbyKey)).toEqual(keyPair)
})

it('offer shared nearby is fetched and decrypted with the nearby key', async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const symmetricKey = yield* generateSymmetricKey()
      const uploaded: ServerPrivatePart[] = []

      const nearbyKey = yield* enableNearbySharing({
        offerApi: createTestOfferApi({
          createPrivatePart: ({offerPrivateList}) => {
            uploaded.push(...offerPrivateList)
            return Effect.void
          },
        }),
        adminId: generateAdminId(),
        symmetricKey,
      })
      const privatePart = yield* Array.head(uploaded)
      expect(privatePart.userPublicKey).toBe(
        nearbyKeyToKeyPair(nearbyKey).publicKeyPemBase64
      )

      const publicPayload = yield* encryptOfferPublicPayload({
        offerPublicPart: publicPart,
        symmetricKey,
      })
      const offerInfo = yield* fetchNearbyOffer({
        nearbyKey,
        offerApi: createTestOfferApi({
          getClubOffersForMeModifiedOrCreatedAfterPaginated: ({keyPair}) => {
            expect(keyPair.publicKeyPemBase64).toBe(privatePart.userPublicKey)
            return Effect.succeed({
              nextPageToken: null,
              hasNext: false,
              limit: 1,
              items: [
                {
                  id: 1,
                  offerId: newOfferId(),
                  publicPayload,
                  privatePayload: privatePart.payloadPrivate,
                  createdAt: isoNow(),
                  modifiedAt: isoNow(),
                },
              ],
            })
          },
        }),
      })

      expect(offerInfo.privatePart.friendLevel).toEqual(['NEARBY'])
      expect(offerInfo.privatePart.symmetricKey).toBe(symmetricKey)
      expect(offerInfo.publicPart.offerDescription).toBe('nearby offer')
    })
  )
})
