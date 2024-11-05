import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {getTokens, Stack, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import deliveryMethodSvg from '../../images/deliveryMethodSvg'
import pickupSvg from '../../images/pickupSvg'
import spokenLanguagesSvg from '../../images/spokenLanguagesSvg'
import mapTagSvg from '../../InsideRouter/components/MarketplaceScreen/images/mapTagSvg'
import {InfoDivider, InfoItemContainer, InfoText} from '../columnsStyles'
import {formatLocationForColumns} from '../utils'
import FiatOrSats from './FiatOrSats'

interface Props {
  offer: OfferInfo
}

function ProductAndOtherOfferColumns({offer}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <XStack f={1} space="$1">
      <FiatOrSats offer={offer} />
      {offer.publicPart.listingType === 'PRODUCT' ? (
        <>
          <InfoItemContainer>
            <XStack mb="$2">
              {offer.publicPart.locationState.includes('IN_PERSON') && (
                <SvgImage
                  height={24}
                  width={24}
                  fill={getTokens().color.greyOnWhite.val}
                  source={pickupSvg}
                />
              )}
              {offer.publicPart.locationState.includes('ONLINE') && (
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
              {offer.publicPart.locationState.includes('IN_PERSON') && (
                <InfoText>{t('offerForm.pickup')}</InfoText>
              )}
              {offer.publicPart.locationState.includes('ONLINE') && (
                <InfoText>{t('offerForm.delivery')}</InfoText>
              )}
            </YStack>
          </InfoItemContainer>
          <InfoDivider />
        </>
      ) : null}
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
      {(offer.publicPart.locationState.includes('IN_PERSON') ||
        (offer.publicPart.listingType === 'OTHER' &&
          offer.publicPart.location.length > 0)) && (
        <>
          <InfoDivider />
          <InfoItemContainer>
            <Stack mb="$2">
              <SvgImage source={mapTagSvg} />
            </Stack>
            <InfoText>
              {formatLocationForColumns(offer.publicPart.location)}
            </InfoText>
          </InfoItemContainer>
        </>
      )}
    </XStack>
  )
}

export default ProductAndOtherOfferColumns
