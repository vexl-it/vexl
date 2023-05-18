import {Stack, XStack} from 'tamagui'
import OfferInfoPreview from './OfferInfoPreview'
import SvgImage from './Image'
import bubbleTipSvg, {
  bubbleTipSvgNegative,
} from './InsideRouter/components/MarketplaceScreen/images/bubbleTipSvg'
import {type ReactNode} from 'react'
import {type OneOfferInState} from '../state/marketplace/domain'
import OfferAuthorAvatar from './OfferAuthorAvatar'

export default function OfferWithBubbleTip({
  offer,
  button,
  negative,
}: {
  offer: OneOfferInState
  button?: ReactNode
  negative?: boolean
}): JSX.Element {
  return (
    <Stack>
      <Stack bg={negative ? '$grey' : '$white'} p="$4" br="$5">
        <OfferInfoPreview negative={negative} offer={offer.offerInfo} />
        <Stack pos="absolute" b={-7} l={43}>
          <SvgImage source={negative ? bubbleTipSvgNegative : bubbleTipSvg} />
        </Stack>
      </Stack>
      <XStack ai="center" jc="space-between" mt="$2">
        <OfferAuthorAvatar offer={offer} negative={negative ?? false} />
        {button && button}
      </XStack>
    </Stack>
  )
}
