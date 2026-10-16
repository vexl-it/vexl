import {Button, ChatInputBar, Screen, Stack, YStack} from '@vexl-next/ui'
import {
  AnonymousAvatar,
  Arrive,
  BotCard,
  ChatHeader,
  ChatMessage,
  ChatOpenedCard,
  DateSuggestionsCard,
  MeetingCard,
  OfferStrip,
  RequestFooter,
  WelcomeCard,
} from '../../shared/chat'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {otherSide, type Side} from '../../shared/side'
import {Tap} from '../../shared/Tap'
import {meeting, offer, tradeOffer, typing} from '../script'
import type {At} from '../tradeDemo'
import {CopyAmountButtons} from './CopyAmountButtons'

function AmountCard({side, at}: {side: Side; at: At}): React.JSX.Element {
  const accepted = at('amountAccepted')
  return (
    <BotCard
      title="Confirm amount"
      description={`${offer.fiatAmount} CZK = ${offer.btcAmount} BTC\nFee: 0%\nExchange rate: ${offer.btcPrice} CZK`}
      statusLabel={
        accepted
          ? 'Accepted'
          : side === 'you'
            ? 'Reaction required'
            : 'Waiting for Other person'
      }
      statusVariant={accepted ? 'waiting' : 'waitingForConfirmation'}
    >
      {accepted ? (
        <CopyAmountButtons />
      ) : side === 'you' ? (
        <Tap on={at('youTapConfirmAmount')}>
          <Button size="medium" variant="primary" onPress={noop}>
            Confirm or edit amount
          </Button>
        </Tap>
      ) : null}
    </BotCard>
  )
}

function Messages({side, at}: {side: Side; at: At}): React.JSX.Element {
  const cardsArrived = at(side === 'you' ? 'youCardsArrive' : 'checklistSent')
  return (
    <YStack flex={1} justifyContent="flex-end" overflow="hidden" pb="$4">
      <ChatMessage
        side={side}
        from="them"
        text={typing.request.text}
        notice="Requested with"
      />
      {side === 'you' && !at('accepted') ? <WelcomeCard /> : null}
      {at('accepted') ? <ChatOpenedCard /> : null}
      {at('youSendReply') ? (
        <Arrive>
          <ChatMessage side={side} from="you" text={typing.youReply.text} />
        </Arrive>
      ) : null}
      {at('themSendReply') ? (
        <Arrive>
          <ChatMessage side={side} from="them" text={typing.themReply.text} />
        </Arrive>
      ) : null}
      {cardsArrived ? (
        <>
          <DateSuggestionsCard
            received={side === 'you'}
            outdated={at('meetingSet')}
            suggestions={meeting.suggestions}
            tapRespond={at('youTapRespond')}
          />
          <AmountCard side={side} at={at} />
        </>
      ) : null}
      {at('meetingSet') ? <MeetingCard details={[meeting.pick]} /> : null}
      {at('nextStep') ? (
        <BotCard
          title="Set network"
          description="Good job! The next step is to agree on the preferred network."
          buttonText="Set network"
          onPress={noop}
        />
      ) : null}
    </YStack>
  )
}

function Footer({
  side,
  at,
  playhead,
}: {
  side: Side
  at: At
  playhead: number
}): React.JSX.Element {
  if (at('accepted')) {
    const draft =
      side === 'you'
        ? at('youSendReply')
          ? ''
          : typedAt(typing.youReply, playhead)
        : at('themSendReply')
          ? ''
          : typedAt(typing.themReply, playhead)
    return (
      <ChatInputBar
        value={draft}
        onChangeText={noop}
        onSendPress={noop}
        placeholder="Type something ..."
      />
    )
  }
  return <RequestFooter side={side} tapAccept={at('youTapAccept')} />
}

/** The chat about the offer, as `side` sees it. */
export function TradeChatScene({
  side,
  at,
  playhead,
}: {
  side: Side
  at: At
  playhead: number
}): React.JSX.Element {
  return (
    <Screen
      safeAreasBackgroundColor="$backgroundSecondary"
      navigationBar={null}
      noHorizontalPadding
    >
      <Stack flex={1}>
        <ChatHeader
          name="Friend of a friend"
          subtitle="3 common"
          avatar={<AnonymousAvatar side={otherSide(side)} size={40} />}
          tap={
            side === 'them' && at('themTapChecklist') ? 'checklist' : undefined
          }
          eyeDisabled={!at('accepted')}
        />
        <OfferStrip
          side={side}
          selling={tradeOffer.selling}
          summary={`Up to 10 000 Kč • Cash • ${offer.location}`}
        />
        <Messages side={side} at={at} />
        <Footer side={side} at={at} playhead={playhead} />
      </Stack>
    </Screen>
  )
}
