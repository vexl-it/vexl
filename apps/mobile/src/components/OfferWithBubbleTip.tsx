import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useCallback, type ReactNode} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, XStack} from 'tamagui'
import SvgImage from './Image'
import OfferAuthorAvatar from './OfferAuthorAvatar'
import OfferInfoPreview from './OfferInfoPreview'
import bubbleTipSvg, {bubbleTipSvgNegative} from './images/bubbleTipSvg'

export default function OfferWithBubbleTip({
  showCommonFriends,
  showListingType,
  isMine,
  offer,
  button,
  negative,
  onInfoRectPress,
  reduceDescriptionLength,
  displayAsPreview,
}: {
  showCommonFriends?: boolean
  showListingType?: boolean
  isMine?: boolean
  offer: OneOfferInState
  button?: ReactNode
  negative?: boolean
  onInfoRectPress?: () => void
  reduceDescriptionLength?: boolean
  displayAsPreview?: boolean
}): JSX.Element {
  const onPress = useCallback(() => {
    if (onInfoRectPress) onInfoRectPress()
  }, [onInfoRectPress])

  return (
    <Stack>
      <TouchableWithoutFeedback
        disabled={!onInfoRectPress}
        testID={offer.offerInfo.publicPart.offerDescription}
        onPress={onPress}
      >
        <Stack bg={negative ? '$grey' : '$white'} p="$4" br="$5">
          <OfferInfoPreview
            displayAsPreview={displayAsPreview}
            showCommonFriends={showCommonFriends}
            showListingType={showListingType}
            isMine={isMine}
            reduceDescriptionLength={reduceDescriptionLength}
            negative={negative}
            offer={offer.offerInfo}
          />
          <Stack pos="absolute" b={-7} l={43}>
            <SvgImage source={negative ? bubbleTipSvgNegative : bubbleTipSvg} />
          </Stack>
        </Stack>
      </TouchableWithoutFeedback>
      <XStack ai="center" jc="space-between" mt="$2">
        <OfferAuthorAvatar
          displayAsPreview={displayAsPreview}
          offer={offer}
          negative={negative ?? false}
        />
        {!!button && <Stack maw="40%">{button}</Stack>}
      </XStack>
    </Stack>
  )
}
