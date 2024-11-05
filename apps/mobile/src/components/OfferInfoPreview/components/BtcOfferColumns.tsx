import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {getTokens, Stack, XStack} from 'tamagui'
import {bigNumberToString} from '../../../utils/bigNumberToString'
import {formatCurrencyAmount} from '../../../utils/localization/currency'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import spokenLanguagesSvg from '../../images/spokenLanguagesSvg'
import bankSvg from '../../InsideRouter/components/MarketplaceScreen/images/bankSvg'
import mapTagSvg from '../../InsideRouter/components/MarketplaceScreen/images/mapTagSvg'
import onlineTransferSvg from '../../InsideRouter/components/MarketplaceScreen/images/onlineTransferSvg'
import {
  InfoDivider,
  InfoItemContainer,
  InfoText,
  PriceBigger,
  PriceText,
} from '../columnsStyles'
import {formatLocationForColumns} from '../utils'

interface Props {
  offer: OfferInfo
}

function BtcOfferColumns({offer}: Props): JSX.Element {
  const {t} = useTranslation()

  const offerAmountTopLimit = useMemo(() => {
    return formatCurrencyAmount(
      offer.publicPart.currency,
      offer.publicPart.amountTopLimit
    )
  }, [offer.publicPart.amountTopLimit, offer.publicPart.currency])

  const offerAmountBottomLimit = useMemo(() => {
    return bigNumberToString(offer.publicPart.amountBottomLimit)
  }, [offer.publicPart.amountBottomLimit])

  return (
    <XStack f={1} space="$1">
      <InfoItemContainer>
        {offer.publicPart.amountBottomLimit > 0 ? (
          <PriceText>
            {t('offer.from')}{' '}
            <PriceBigger>{offerAmountBottomLimit}</PriceBigger> {t('offer.to')}{' '}
            <PriceBigger>{offerAmountTopLimit}</PriceBigger>
          </PriceText>
        ) : (
          <PriceText>
            {t('offer.upTo')} <PriceBigger>{offerAmountTopLimit}</PriceBigger>
          </PriceText>
        )}
        <InfoText>
          {offer.publicPart.locationState.includes('ONLINE') &&
            t('offer.onlineOnly')}
          {offer.publicPart.locationState.includes('IN_PERSON') &&
            t('offer.cashOnly')}
        </InfoText>
      </InfoItemContainer>
      <InfoDivider />
      {offer.publicPart.feeState === 'WITH_FEE' &&
        offer.publicPart.feeAmount !== undefined &&
        offer.publicPart.feeAmount !== 0 && (
          <>
            <InfoItemContainer>
              <PriceText>
                <PriceBigger>
                  {Math.abs(offer.publicPart.feeAmount)} %
                </PriceBigger>
              </PriceText>
              <InfoText>
                {offer.publicPart.feeAmount > 0
                  ? t('offer.forSeller')
                  : t('offer.forBuyer')}
              </InfoText>
            </InfoItemContainer>
            <InfoDivider />
          </>
        )}
      {offer.publicPart.spokenLanguages.length > 0 && (
        <>
          <InfoItemContainer>
            <Stack mb="$2">
              <SvgImage
                height={20}
                width={20}
                fill={getTokens().color.greyOnWhite.val}
                source={spokenLanguagesSvg}
              />
            </Stack>
            <InfoText>{offer.publicPart.spokenLanguages?.join(', ')}</InfoText>
          </InfoItemContainer>
          <InfoDivider />
        </>
      )}
      <InfoItemContainer>
        <XStack mb="$2">
          {offer.publicPart.paymentMethod.includes('CASH') && (
            <Stack mx="$1">
              <SvgImage height={20} width={20} source={mapTagSvg} />
            </Stack>
          )}
          {offer.publicPart.paymentMethod.includes('REVOLUT') && (
            <Stack mx="$1">
              <SvgImage height={20} width={20} source={onlineTransferSvg} />
            </Stack>
          )}
          {offer.publicPart.paymentMethod.includes('BANK') && (
            <Stack mx="$1">
              <SvgImage height={20} width={20} source={bankSvg} />
            </Stack>
          )}
        </XStack>
        <InfoText>
          {offer.publicPart.paymentMethod
            .map((method) => {
              if (method === 'CASH') {
                return formatLocationForColumns(offer.publicPart.location)
              }
              if (method === 'REVOLUT') {
                return t('offer.revolut')
              }
              if (method === 'BANK') {
                return t('offer.bank')
              }
              return null
            })
            .filter(Boolean)
            .join(', ')}
        </InfoText>
      </InfoItemContainer>
    </XStack>
  )
}

export default BtcOfferColumns
