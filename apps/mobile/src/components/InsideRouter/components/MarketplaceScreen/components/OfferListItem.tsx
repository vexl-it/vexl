import SvgImage from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {bigNumberToString} from '../../../../../utils/bigNumberToString'
import bankSvg from '../images/bankSvg'
import revolutSvg from '../images/revolutSvg'
import mapTagSvg from '../images/mapTagSvg'
import Button from '../../../../Button'
import {AnonymousAvatarFromSeed} from '../../../../AnonymousAvatar'
import randomName from '../../../../../utils/randomName'
import {useNavigation} from '@react-navigation/native'
import bubbleTipSvg from '../images/bubbleTipSvg'
import {type OneOfferInState} from '../../../../../state/marketplace/domain'
import {Stack, styled, Text, XStack} from 'tamagui'
import {type StyleProp, type ViewStyle} from 'react-native'
import {useMemo} from 'react'

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
})

const PriceText = styled(InfoText, {
  mb: '$2',
})

const PriceBigger = styled(InfoText, {
  fos: 20,
})

interface Props {
  readonly offer: OneOfferInState
}

function OfferListItem({offer: {offerInfo: offer}}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const avatarStyles: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: 48,
      height: 48,
    }),
    []
  )
  return (
    <Stack mt="$6">
      <Stack bg="$white" p="$4" br="$5">
        <Text fos={20} mb="$4" ff="body500">
          {offer.publicPart.offerDescription}
        </Text>
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
                  <SvgImage source={revolutSvg} />
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
        position: absolute; bottom: -7px; left: 43px;
        <Stack pos="absolute" b={-7} l={43}>
          <SvgImage source={bubbleTipSvg} />
        </Stack>
      </Stack>
      <XStack ai="center" jc="space-between" mt="$2">
        <AnonymousAvatarFromSeed style={avatarStyles} seed={offer.offerId} />
        <Stack f={1} ml="$2">
          <Text col="$white">
            {randomName(offer.offerId)}{' '}
            <Text col="$pink">
              {offer.publicPart.offerType === 'SELL'
                ? t('offer.isSelling')
                : t('offer.isBuying')}
              <Text fos={14} col="$greyOnBlack">
                {offer.privatePart.friendLevel.includes('FIRST_DEGREE')
                  ? t('offer.directFriend')
                  : t('offer.friendOfFriend')}
              </Text>
            </Text>
          </Text>
        </Stack>
        <Button
          small
          fontSize={14}
          text={t('common.request')}
          variant="secondary"
          onPress={() => {
            navigation.navigate('OfferDetail', {offerId: offer.offerId})
          }}
        />
        {/* Friend of friend info */}
      </XStack>
    </Stack>
  )
}

export default OfferListItem
