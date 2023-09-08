import {getTokens, Stack, styled, Text, XStack} from 'tamagui'
import {formatCurrencyAmount} from '../utils/localization/currency'
import SvgImage from './Image'
import mapTagSvg from './InsideRouter/components/MarketplaceScreen/images/mapTagSvg'
import bankSvg from './InsideRouter/components/MarketplaceScreen/images/bankSvg'
import {type OfferInfo} from '@vexl-next/domain/dist/general/offers'
import {useTranslation} from '../utils/localization/I18nProvider'
import onlineTransferSvg from './InsideRouter/components/MarketplaceScreen/images/onlineTransferSvg'
import getBtcPragueLogoSvg from './InsideRouter/components/MarketplaceScreen/images/btcPragueLogoSvg'
import {useMemo} from 'react'
import pauseSvg from '../images/pauseSvg'
import spokenLanguagesSvg from './images/spokenLanguagesSvg'

const BTC_PRAGUE_FRIEND = '8o5OvkfRga/xBYbfb0e0MJZIjy4g7xGVimCdNLrydGs='
const BTC_PRAGUE_FRIEND_STAGE = '9c6r0q7LCn1oqES2pfqQDVQH91fY8ZHYcJKbJYOU7hE='

const InfoItemContainer = styled(Stack, {
  f: 1,
  ai: 'center',
})

const InfoDivider = styled(Stack, {
  bg: 'rgb(196, 196, 196)',
  w: 1,
  als: 'stretch',
})

const InfoText = styled(Text, {
  col: '$greyOnWhite',
  fos: 14,
  ff: '$body500',
  textAlign: 'center',
})

const PriceText = styled(InfoText, {
  mb: '$2',
})

const PriceBigger = styled(InfoText, {
  fos: 20,
})

function OfferInfoPreview({
  hideSpokenLanguages,
  offer,
  negative,
}: {
  hideSpokenLanguages?: boolean
  offer: OfferInfo
  negative?: boolean
}): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const btcPragueLogoSvg = useMemo(
    () => getBtcPragueLogoSvg({darkBackground: negative}),
    [negative]
  )

  const offerAmount = useMemo(() => {
    return formatCurrencyAmount(
      offer.publicPart.currency,
      offer.publicPart.amountTopLimit
    )
  }, [offer.publicPart.amountTopLimit, offer.publicPart.currency])

  return (
    <>
      {(offer.privatePart.commonFriends.includes(BTC_PRAGUE_FRIEND) ||
        offer.privatePart.commonFriends.includes(BTC_PRAGUE_FRIEND_STAGE)) && (
        <Stack alignSelf={'flex-end'}>
          <SvgImage width={60} height={20} source={btcPragueLogoSvg} />
        </Stack>
      )}
      <XStack ai={'flex-start'} jc={'space-between'}>
        <XStack mb={'$4'}>
          <Text
            flex={1}
            fos={20}
            color={negative ? '$greyOnBlack' : '$black'}
            ff="$body500"
          >
            {offer.publicPart.offerDescription}
          </Text>
          {!offer.publicPart.active && (
            <SvgImage
              stroke={getTokens().color.$greyOnBlack.val}
              source={pauseSvg}
            />
          )}
        </XStack>
      </XStack>
      <XStack space={'$1'}>
        <InfoItemContainer>
          <PriceText>
            {t('offer.upTo')} <PriceBigger>{offerAmount}</PriceBigger>
          </PriceText>
          <InfoText>
            {offer.publicPart.locationState === 'ONLINE' &&
              t('offer.onlineOnly')}
            {offer.publicPart.locationState === 'IN_PERSON' &&
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
        {!hideSpokenLanguages &&
          offer.publicPart.spokenLanguages.length > 0 && (
            <InfoItemContainer>
              <Stack mb={'$2'}>
                <SvgImage
                  height={24}
                  width={24}
                  fill={tokens.color.greyOnWhite.val}
                  source={spokenLanguagesSvg}
                />
              </Stack>
              <InfoText>
                {offer.publicPart.spokenLanguages?.join(', ')}
              </InfoText>
            </InfoItemContainer>
          )}
        {!hideSpokenLanguages &&
          offer.publicPart.spokenLanguages.length > 0 && <InfoDivider />}
        <InfoItemContainer>
          <XStack mb="$2">
            {offer.publicPart.paymentMethod.includes('CASH') && (
              <Stack mx="$1">
                <SvgImage source={mapTagSvg} />
              </Stack>
            )}
            {offer.publicPart.paymentMethod.includes('REVOLUT') && (
              <Stack mx="$1">
                <SvgImage height={25} width={25} source={onlineTransferSvg} />
              </Stack>
            )}
            {offer.publicPart.paymentMethod.includes('BANK') && (
              <Stack mx="$1">
                <SvgImage source={bankSvg} />
              </Stack>
            )}
          </XStack>
          <InfoText>
            {offer.publicPart.paymentMethod
              .map((method) => {
                if (method === 'CASH') {
                  return offer.publicPart.location
                    .map((one) => one.city)
                    .join(', ')
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
    </>
  )
}

export default OfferInfoPreview
