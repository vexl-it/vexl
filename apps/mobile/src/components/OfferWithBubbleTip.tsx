import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useCallback, type ReactNode} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, XStack} from 'tamagui'
import SvgImage from './Image'
import OfferAuthorAvatar from './OfferAuthorAvatar'
import OfferInfoPreview from './OfferInfoPreview'
import bubbleTipSvg, {bubbleTipSvgNegative} from './images/bubbleTipSvg'

export default function OfferWithBubbleTip({
  offer,
  button,
  negative,
  onInfoRectPress,
  hideSpokenLanguages,
  reduceDescriptionLength,
}: {
  offer: OneOfferInState
  button?: ReactNode
  negative?: boolean
  onInfoRectPress?: () => void
  hideSpokenLanguages?: boolean
  reduceDescriptionLength?: boolean
}): JSX.Element {
  const onPress = useCallback(() => {
    if (onInfoRectPress) onInfoRectPress()
  }, [onInfoRectPress])

  return (
    <Stack>
      <TouchableWithoutFeedback onPress={onPress}>
        <Stack bg={negative ? '$grey' : '$white'} p="$4" br="$5">
          <OfferInfoPreview
            reduceDescriptionLength={reduceDescriptionLength}
            hideSpokenLanguages={hideSpokenLanguages}
            negative={negative}
            offer={offer.offerInfo}
          />
          <Stack pos="absolute" b={-7} l={43}>
            <SvgImage source={negative ? bubbleTipSvgNegative : bubbleTipSvg} />
          </Stack>
        </Stack>
      </TouchableWithoutFeedback>
      <XStack ai="center" jc="space-between" mt="$2">
        <OfferAuthorAvatar offer={offer} negative={negative ?? false} />
        {!!button && <Stack maw="60%">{button}</Stack>}
      </XStack>
    </Stack>
  )
}
