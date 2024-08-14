import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatCurrencyAmount} from '../../../utils/localization/currency'
import {marketplaceFiatOrSatsCurrencyAtom} from '../../../utils/preferences'
import {
  InfoDivider,
  InfoItemContainer,
  InfoText,
  PriceBigger,
  PriceText,
} from '../columnsStyles'
import PriceInSats from './PriceInSats'

interface Props {
  offer: OfferInfo
}
function FiatOrSats({offer}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const marketplaceFiatOrSatsCurrency = useAtomValue(
    marketplaceFiatOrSatsCurrencyAtom
  )
  const offerHasPrice = useMemo(
    () =>
      offer.publicPart.amountBottomLimit !== 0 &&
      offer.publicPart.amountTopLimit !== 0,
    [offer.publicPart.amountBottomLimit, offer.publicPart.amountTopLimit]
  )

  const offerAmountBottomLimit = useMemo(() => {
    return formatCurrencyAmount(
      offer.publicPart.currency,
      offer.publicPart.amountBottomLimit
    )
  }, [offer.publicPart.amountBottomLimit, offer.publicPart.currency])

  if (!offerHasPrice) return null

  return (
    <>
      {marketplaceFiatOrSatsCurrency === 'FIAT' ? (
        <>
          <InfoItemContainer>
            <PriceText>
              <PriceBigger>{offerAmountBottomLimit}</PriceBigger>
            </PriceText>
            <InfoText>
              {offer.publicPart.locationState.includes('IN_PERSON') &&
                t('offer.cash')}
              {offer.publicPart.locationState.length > 1 && ', '}
              {offer.publicPart.locationState.includes('ONLINE') &&
                t('offer.online')}
            </InfoText>
          </InfoItemContainer>
          <InfoDivider />
        </>
      ) : (
        <PriceInSats offer={offer} />
      )}
    </>
  )
}

export default FiatOrSats
