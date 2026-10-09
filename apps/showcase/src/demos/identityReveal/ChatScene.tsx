import {
  Avatar,
  Button,
  ChatInputBar,
  RevealedInfoCard,
  revealedInfoCardAvatarSize,
  Screen,
  Stack,
  VexlbotActionCard,
  XStack,
  YStack,
  type RevealedInfoCardSide,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {AnonymousAvatar, Arrive, ChatHeader, ChatMessage} from '../shared/chat'
import {noop} from '../shared/noop'
import {otherSide, type Side} from '../shared/side'
import {Tap} from '../shared/Tap'
import {conversation, people} from './script'

const revealedDetails = 'Nickname, Profile photo'

export interface ChatSceneState {
  readonly revealed: boolean
  readonly request?: 'sent' | 'received' | undefined
  readonly tap?: 'eye' | 'review' | undefined
}

function PersonAvatar({
  side,
  revealed,
  size,
}: {
  side: Side
  revealed: boolean
  size: number
}): React.JSX.Element {
  return revealed ? (
    <Avatar customSize={size} source={{uri: people[side].photo}} />
  ) : (
    <AnonymousAvatar side={side} size={size} />
  )
}

function RequestCard({
  direction,
  tapReview,
}: {
  direction: 'sent' | 'received'
  tapReview: boolean
}): React.JSX.Element {
  return direction === 'sent' ? (
    <VexlbotActionCard
      mt="$2"
      brandLabel="Vexl"
      botLabel="bot"
      statusLabel="Pending"
      title="You asked to reveal identities"
      description={revealedDetails}
      details={['Your details stay hidden until they agree.']}
    />
  ) : (
    <VexlbotActionCard
      mt="$2"
      brandLabel="Vexl"
      botLabel="bot"
      statusLabel="Reaction required"
      title="They want to reveal identities"
      description={revealedDetails}
      details={[
        'You both reveal the same details. Check yours before agreeing.',
      ]}
    >
      <XStack gap="$3" width="100%">
        <Button flex={1} size="medium" variant="secondary" onPress={noop}>
          No, thanks
        </Button>
        <Tap on={tapReview} flex={1}>
          <Button size="medium" variant="primary" onPress={noop}>
            Review reveal
          </Button>
        </Tap>
      </XStack>
    </VexlbotActionCard>
  )
}

function OutcomeCard({side}: {side: Side}): React.JSX.Element {
  const sideInfo = (person: Side): RevealedInfoCardSide => ({
    avatar: (
      <PersonAvatar side={person} revealed size={revealedInfoCardAvatarSize} />
    ),
    name: people[person].name,
    phoneNumber: people[person].anonymizedPhone,
  })
  return (
    <RevealedInfoCard
      title="Identities revealed"
      description={`You both revealed: ${revealedDetails}`}
      leftSide={sideInfo(side)}
      rightSide={sideInfo(otherSide(side))}
    />
  )
}

/** The trade chat as `side` sees it. */
export function ChatScene({
  side,
  state: {revealed, request, tap},
}: {
  side: Side
  state: ChatSceneState
}): React.JSX.Element {
  return (
    <Screen
      safeAreasBackgroundColor="$backgroundSecondary"
      navigationBar={null}
      noHorizontalPadding
    >
      <Stack flex={1}>
        <ChatHeader
          name={revealed ? people[otherSide(side)].name : 'Friend of a friend'}
          subtitle="3 common"
          avatar={
            <Stack
              key={String(revealed)}
              className={revealed ? 'demo-arrive' : ''}
            >
              <PersonAvatar
                side={otherSide(side)}
                revealed={revealed}
                size={40}
              />
            </Stack>
          }
          tap={tap === 'eye' ? 'eye' : undefined}
        />
        <YStack flex={1} justifyContent="flex-end" overflow="hidden" pb="$4">
          {pipe(
            conversation,
            Array.map(({from, text}) => (
              <ChatMessage key={text} side={side} from={from} text={text} />
            ))
          )}
          {request && !revealed ? (
            <Arrive>
              <Stack mx="$4">
                <RequestCard direction={request} tapReview={tap === 'review'} />
              </Stack>
            </Arrive>
          ) : null}
          {revealed ? (
            <Arrive>
              <YStack mx="$4" mt="$4">
                <OutcomeCard side={side} />
              </YStack>
            </Arrive>
          ) : null}
        </YStack>
        <ChatInputBar
          value=""
          onChangeText={noop}
          onSendPress={noop}
          placeholder="Type something ..."
        />
      </Stack>
    </Screen>
  )
}
