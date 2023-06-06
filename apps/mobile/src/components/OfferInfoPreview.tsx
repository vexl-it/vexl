import {Stack, styled, Text, XStack} from 'tamagui'
import {bigNumberToString} from '../utils/bigNumberToString'
import SvgImage from './Image'
import mapTagSvg from './InsideRouter/components/MarketplaceScreen/images/mapTagSvg'
import bankSvg from './InsideRouter/components/MarketplaceScreen/images/bankSvg'
import {type OfferInfo} from '@vexl-next/domain/dist/general/offers'
import {useTranslation} from '../utils/localization/I18nProvider'
import onlineTransferSvg from './InsideRouter/components/MarketplaceScreen/images/onlineTransferSvg'
import getBtcPragueLogoSvg from './InsideRouter/components/MarketplaceScreen/images/btcPragueLogoSvg'
import {useMemo} from 'react'

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
  offer,
  negative,
}: {
  offer: OfferInfo
  negative?: boolean
}): JSX.Element {
  const {t} = useTranslation()
  const btcPragueLogoSvg = useMemo(
    () => getBtcPragueLogoSvg({darkBackground: negative}),
    [negative]
  )

  console.log(
    `OfferTitle: ${
      offer.publicPart.offerDescription
    } and hash: ${JSON.stringify(offer.privatePart.commonFriends, null, 2)}`
  )

  return (
    <>
      {offer.privatePart.commonFriends.includes(BTC_PRAGUE_FRIEND) ||
        (offer.privatePart.commonFriends.includes(BTC_PRAGUE_FRIEND_STAGE) && (
          <Stack alignSelf={'flex-end'}>
            <SvgImage width={60} height={20} source={btcPragueLogoSvg} />
          </Stack>
        ))}
      <XStack ai={'flex-start'} jc={'space-between'}>
        <Stack>
          <Text
            fos={20}
            mb="$4"
            color={negative ? '$greyOnBlack' : '$black'}
            ff="$body500"
          >
            {offer.publicPart.offerDescription}
          </Text>
        </Stack>
      </XStack>
      <XStack>
        <InfoItemContainer>
          <PriceText>
            {t('offer.upTo')}{' '}
            <PriceBigger>
              {bigNumberToString(offer.publicPart.amountTopLimit)}
            </PriceBigger>
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
          offer.publicPart.feeAmount !== undefined && (
            <>
              <InfoItemContainer>
                <PriceText>
                  <PriceBigger>{offer.publicPart.feeAmount} %</PriceBigger>
                </PriceText>
                <InfoText>{t('offer.forSeller')}</InfoText>
              </InfoItemContainer>
              <InfoDivider />
            </>
          )}
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
