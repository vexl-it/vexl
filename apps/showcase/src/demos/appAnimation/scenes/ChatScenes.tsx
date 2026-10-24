import {Button, ChatInputBar, Copy, Screen, Stack, YStack} from '@vexl-next/ui'
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
} from '../../shared/chat'
import {noop} from '../../shared/noop'
import {typedAt} from '../../shared/playback'
import {PushNotification} from '../../shared/PushNotification'
import type {Side} from '../../shared/side'
import type {SceneProps} from '../script'
import {meetingTimeLabel} from './MeetingScenes'

// We sent the request, which makes us side 'them' of the shared chat pieces.
const side: Side = 'them'

function LocationCard({
  place,
  accepted,
}: {
  place: string
  accepted: boolean
}): React.JSX.Element {
  return (
    <BotCard
      statusLabel={accepted ? 'Accepted' : 'Waiting for Other person'}
      statusVariant={accepted ? 'waiting' : 'waitingForConfirmation'}
      title={accepted ? 'Meeting location' : 'Location is set'}
      description={`${accepted ? 'Location is set' : 'Meeting:'} ${place}`}
    >
      <Button icon={Copy} size="small" variant="secondary" onPress={noop}>
        Copy address
      </Button>
    </BotCard>
  )
}

function Message({from, text}: {from: Side; text: string}): React.JSX.Element {
  return (
    <Arrive>
      <ChatMessage side={side} from={from} text={text} />
    </Arrive>
  )
}

/** The chat about the chosen offer, from the request to the agreed meeting. */
export function ChatScene({
  config,
  script,
  at,
  playhead,
}: SceneProps): React.JSX.Element {
  const offer = script.chosenOffer
  const {messages, meeting} = config
  const meetingAccepted = at('meetingAccepted')
  const draft = at('sendYourReply')
    ? typedAt(script.typing.letsMeet, playhead)
    : typedAt(script.typing.yourReply, playhead)
  return (
    <Screen
      safeAreasBackgroundColor="$backgroundSecondary"
      navigationBar={null}
      noHorizontalPadding
    >
      <Stack flex={1}>
        <ChatHeader
          name={offer?.name ?? ''}
          subtitle={offer ? `${offer.commonFriends} common` : undefined}
          avatar={<AnonymousAvatar side="you" size={40} />}
          tap={at('tapChecklist') ? 'checklist' : undefined}
          eyeDisabled={!at('approved')}
        />
        {offer ? (
          <OfferStrip
            side={side}
            selling={offer.selling}
            summary={`${offer.price} • ${offer.location}`}
          />
        ) : null}
        <YStack flex={1} justifyContent="flex-end" overflow="hidden" pb="$4">
          <ChatMessage
            side={side}
            from="them"
            text={messages.request}
            notice="Requested with"
          />
          {at('approved') ? <ChatOpenedCard /> : null}
          {at('theirFirstMessage') ? (
            <Message from="you" text={messages.theirFirst} />
          ) : null}
          {at('sendYourReply') ? (
            <Message from="them" text={messages.yourReply} />
          ) : null}
          {at('sendLetsMeet') ? (
            <Message from="them" text={messages.letsMeet} />
          ) : null}
          {at('theirLetsMeetReply') ? (
            <Message from="you" text={messages.theirLetsMeetReply} />
          ) : null}
          {at('checklistSent') ? (
            <>
              <DateSuggestionsCard
                received={false}
                outdated={meetingAccepted}
                suggestions={[meetingTimeLabel(meeting)]}
              />
              <LocationCard place={meeting.place} accepted={meetingAccepted} />
            </>
          ) : null}
          {meetingAccepted ? (
            <MeetingCard details={[meetingTimeLabel(meeting), meeting.place]} />
          ) : null}
        </YStack>
        {at('approved') ? (
          <ChatInputBar
            value={at('sendLetsMeet') ? '' : draft}
            onChangeText={noop}
            onSendPress={noop}
            placeholder="Type something ..."
          />
        ) : (
          <RequestFooter side={side} tapAccept={false} />
        )}
      </Stack>
    </Screen>
  )
}

/** "You're connected!" sliding in once they accept the request. */
export function ApprovedNotification({at}: SceneProps): React.JSX.Element {
  return (
    <PushNotification
      title="You’re connected!"
      body="Start the conversation."
      tap={at('tapApprovedNotification')}
    />
  )
}
