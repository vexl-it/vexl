import {Stack, XStack} from 'tamagui'
import OfferInfoPreview from './OfferInfoPreview'
import SvgImage from './Image'

import {type ReactNode, useCallback} from 'react'
import OfferAuthorAvatar from './OfferAuthorAvatar'
import {TouchableWithoutFeedback} from 'react-native'
import bubbleTipSvg, {bubbleTipSvgNegative} from './images/bubbleTipSvg'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'

export default function OfferWithBubbleTip({
  offer,
  button,
  negative,
  onInfoRectPress,
  hideSpokenLanguages,
}: {
  offer: OneOfferInState
  button?: ReactNode
  negative?: boolean
  onInfoRectPress?: () => void
  hideSpokenLanguages?: boolean
}): JSX.Element {
  const onPress = useCallback(() => {
    if (onInfoRectPress) onInfoRectPress()
  }, [onInfoRectPress])

  return (
    <Stack>
      <TouchableWithoutFeedback onPress={onPress}>
        <Stack bg={negative ? '$grey' : '$white'} p="$4" br="$5">
          <OfferInfoPreview
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
        {button && <Stack maw={'60%'}>{button}</Stack>}
      </XStack>
    </Stack>
  )
}
