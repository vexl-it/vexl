import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {getTokens, Stack, XStack, YStack} from 'tamagui'
import {bigNumberToString} from '../../../utils/bigNumberToString'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import deliveryMethodSvg from '../../images/deliveryMethodSvg'
import pickupSvg from '../../images/pickupSvg'
import spokenLanguagesSvg from '../../images/spokenLanguagesSvg'
import mapTagSvg from '../../InsideRouter/components/MarketplaceScreen/images/mapTagSvg'
import {
  InfoDivider,
  InfoItemContainer,
  InfoText,
  PriceBigger,
  PriceText,
} from '../columnsStyles'

interface Props {
  offer: OfferInfo
}

function ProductAndOtherOfferColumns({offer}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <XStack f={1} space="$1">
      {offer.publicPart.singlePriceState === 'HAS_COST' && (
        <>
          <InfoItemContainer>
            <PriceText>
              <PriceBigger>
                {bigNumberToString(offer.publicPart.singlePriceValue)}
              </PriceBigger>
            </PriceText>
            <InfoText>SATS</InfoText>
          </InfoItemContainer>
          <InfoDivider />
        </>
      )}
      {!!offer.publicPart.deliveryMethod &&
        offer.publicPart.deliveryMethod.length > 0 && (
          <>
            <InfoItemContainer>
              <XStack mb="$2">
                {offer.publicPart.deliveryMethod.includes('PICKUP') && (
                  <SvgImage
                    height={24}
                    width={24}
                    fill={getTokens().color.greyOnWhite.val}
                    source={pickupSvg}
                  />
                )}
                {offer.publicPart.deliveryMethod.includes('DELIVERY') && (
                  <SvgImage
                    height={24}
                    width={24}
                    fill="none"
                    stroke={getTokens().color.greyOnWhite.val}
                    source={deliveryMethodSvg}
                  />
                )}
              </XStack>
              <YStack>
                {offer.publicPart.deliveryMethod.includes('PICKUP') && (
                  <InfoText>{t('offerForm.pickup')}</InfoText>
                )}
                {offer.publicPart.deliveryMethod.includes('DELIVERY') && (
                  <InfoText>{t('offerForm.delivery')}</InfoText>
                )}
              </YStack>
            </InfoItemContainer>
            <InfoDivider />
          </>
        )}

      {offer.publicPart.spokenLanguages.length > 0 && (
        <>
          <InfoItemContainer>
            <Stack mb="$2">
              <SvgImage
                height={24}
                width={24}
                fill={getTokens().color.greyOnWhite.val}
                source={spokenLanguagesSvg}
              />
            </Stack>
            <InfoText>{offer.publicPart.spokenLanguages?.join(', ')}</InfoText>
          </InfoItemContainer>
        </>
      )}
      {(offer.publicPart.deliveryMethod.includes('PICKUP') ||
        (offer.publicPart.listingType === 'OTHER' &&
          offer.publicPart.location.length > 0)) && (
        <>
          <InfoDivider />
          <InfoItemContainer>
            <Stack mb="$2">
              <SvgImage source={mapTagSvg} />
            </Stack>
            <InfoText>
              {offer.publicPart.location
                .map((one) => one.shortAddress)
                .join(', ')}
            </InfoText>
          </InfoItemContainer>
        </>
      )}
    </XStack>
  )
}

export default ProductAndOtherOfferColumns
