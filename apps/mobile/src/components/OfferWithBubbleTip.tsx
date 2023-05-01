import {Stack, Text, XStack} from 'tamagui'
import OfferInfoPreview from './OfferInfoPreview'
import SvgImage from './Image'
import bubbleTipSvg, {
  bubbleTipSvgNegative,
} from './InsideRouter/components/MarketplaceScreen/images/bubbleTipSvg'
import {AnonymousAvatarFromSeed} from './AnonymousAvatar'
import randomName from '../utils/randomName'
import {type StyleProp, type ViewStyle} from 'react-native'
import {useMemo} from 'react'
import {type OneOfferInState} from '../state/marketplace/domain'
import {useTranslation} from '../utils/localization/I18nProvider'

export default function OfferWithBubbleTip({
  offer: {offerInfo: offer},
  button,
  negative,
}: {
  offer: OneOfferInState
  button?: React.ReactNode
  negative?: boolean
}): JSX.Element {
  const {t} = useTranslation()
  const avatarStyles: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: 48,
      height: 48,
    }),
    []
  )

  return (
    <Stack>
      <Stack bg={negative ? '$grey' : '$white'} p="$4" br="$5">
        <OfferInfoPreview negative={negative} offer={offer} />
        <Stack pos="absolute" b={-7} l={43}>
          <SvgImage source={negative ? bubbleTipSvgNegative : bubbleTipSvg} />
        </Stack>
      </Stack>
      <XStack ai="center" jc="space-between" mt="$2">
        <AnonymousAvatarFromSeed
          grayScale={negative ?? false}
          width={48}
          height={48}
          style={avatarStyles}
          seed={offer.offerId}
        />
        <Stack f={1} ml="$2">
          <Text ff={'$body600'} col={'$white'}>
            {randomName(offer.offerId)}{' '}
            <Text ff={'$body600'} col={negative ? '$greyOnBlack' : '$pink'}>
              {offer.publicPart.offerType === 'SELL'
                ? t('offer.isSelling')
                : t('offer.isBuying')}
            </Text>
          </Text>
          <Text ff={'$body500'} fos={14} col="$greyOnBlack">
            {offer.privatePart.friendLevel.includes('FIRST_DEGREE')
              ? t('offer.directFriend')
              : t('offer.friendOfFriend')}
            {' • '}
            {t('offer.numberOfCommon', {
              number: offer.privatePart.commonFriends.length,
            })}
          </Text>
        </Stack>
        {button && button}
        {/* Friend of friend info */}
      </XStack>
    </Stack>
  )
}
