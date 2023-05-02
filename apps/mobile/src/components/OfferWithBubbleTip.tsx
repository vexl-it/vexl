import {Stack, XStack} from 'tamagui'
import OfferInfoPreview from './OfferInfoPreview'
import SvgImage from './Image'
import bubbleTipSvg, {
  bubbleTipSvgNegative,
} from './InsideRouter/components/MarketplaceScreen/images/bubbleTipSvg'
import {AnonymousAvatarFromSeed} from './AnonymousAvatar'
import randomName from '../utils/randomName'
import {type StyleProp, type ViewStyle} from 'react-native'
import {type ReactNode, useMemo} from 'react'
import {type OneOfferInState} from '../state/marketplace/domain'
import UserNameWithSellingBuying from './UserNameWithSellingBuying'
import ContactTypeAndCommonNumber from './ContactTypeAndCommonNumber'

export default function OfferWithBubbleTip({
  offer: {offerInfo: offer, adminId},
  button,
  negative,
}: {
  offer: OneOfferInState
  button?: ReactNode
  negative?: boolean
}): JSX.Element {
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
          <UserNameWithSellingBuying
            offerInfo={{
              offerType: offer.publicPart.offerType,
              offerDirection: adminId ? 'myOffer' : 'theirOffer',
            }}
            userName={randomName(offer.offerId)}
          />
          <ContactTypeAndCommonNumber
            friendLevel={offer.privatePart.friendLevel ?? []}
            numberOfCommonFriends={offer.privatePart.commonFriends.length}
          />
        </Stack>
        {button && button}
        {/* Friend of friend info */}
      </XStack>
    </Stack>
  )
}
