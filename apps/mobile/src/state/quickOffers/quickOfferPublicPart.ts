import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type GoldenAvatarType,
  type OfferPublicPart,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {version} from '../../utils/environment'

// A quick offer says only buy or sell. Everything else a classic offer
// requires gets the emptiest value the schema allows.
export const createQuickOfferPublicPart = ({
  offerType,
  offerPublicKey,
  currency,
  goldenAvatarType,
}: {
  readonly offerType: OfferType
  readonly offerPublicKey: PublicKeyPemBase64
  readonly currency: CurrencyCode
  readonly goldenAvatarType: GoldenAvatarType | undefined
}): OfferPublicPart => ({
  isQuickOffer: true,
  offerType,
  offerPublicKey,
  listingType: 'BITCOIN',
  active: true,
  offerDescription: '',
  amountBottomLimit: 0,
  amountTopLimit: 0,
  currency,
  feeState: 'WITHOUT_FEE',
  feeAmount: 0,
  location: [],
  locationState: [],
  paymentMethod: [],
  btcNetwork: [],
  spokenLanguages: [],
  activePriceState: 'NONE',
  activePriceValue: 0,
  activePriceCurrency: currency,
  groupUuids: [],
  authorClientVersion: version,
  goldenAvatarType,
})
