import {Screen, Stack, YStack} from '@vexl-next/ui'
import {
  AnonymousAvatar,
  ChatHeader,
  ChatMessage,
  OfferStrip,
  RequestFooter,
  WelcomeCard,
} from '../shared/chat'
import {otherSide, type Side} from '../shared/side'
import {nearbyOffer, offerSummary, request} from './script'

/** The chat their request opened, as `side` sees it. It goes through Vexl's servers like any other. */
export function ChatScene({side}: {side: Side}): React.JSX.Element {
  return (
    <Screen
      safeAreasBackgroundColor="$backgroundSecondary"
      navigationBar={null}
      noHorizontalPadding
    >
      <Stack flex={1}>
        <ChatHeader
          name={nearbyOffer.name}
          avatar={<AnonymousAvatar side={otherSide(side)} size={40} />}
          eyeDisabled
        />
        <OfferStrip side={side} summary={offerSummary} />
        <YStack flex={1} justifyContent="flex-end" overflow="hidden" pb="$4">
          <ChatMessage
            side={side}
            from="them"
            text={request.text}
            notice="Requested with"
          />
          {side === 'you' ? <WelcomeCard /> : null}
        </YStack>
        <RequestFooter side={side} tapAccept={false} />
      </Stack>
    </Screen>
  )
}
