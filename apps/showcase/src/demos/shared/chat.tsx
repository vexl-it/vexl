import {
  Avatar,
  avatarsSvg,
  Button,
  ChatBubble,
  Checklist,
  ChevronLeft,
  EyeShut,
  InfoBox,
  NavButton,
  NavigationBar,
  Stack,
  Typography,
  VexlbotActionCard,
  XmarkCancelClose,
  XStack,
  YStack,
  type VexlbotActionCardProps,
} from '@vexl-next/ui'
import type {ReactNode} from 'react'
import {noop} from './noop'
import type {Side} from './side'
import {Tap} from './Tap'

// The generated avatar each person shows to the other while anonymous.
const anonymousAvatars: Record<Side, (typeof avatarsSvg)[number] | undefined> =
  {you: avatarsSvg[11], them: avatarsSvg[4]}

export function AnonymousAvatar({
  side,
  size,
}: {
  side: Side
  size: number
}): React.JSX.Element {
  const Anonymous = anonymousAvatars[side]
  return (
    <Avatar customSize={size}>
      {Anonymous ? <Anonymous size={size} /> : null}
    </Avatar>
  )
}

/** Content that slides in when it first renders. */
export function Arrive({children}: {children: ReactNode}): React.JSX.Element {
  return <Stack className="demo-arrive">{children}</Stack>
}

export function ChatHeader({
  name,
  subtitle,
  avatar,
  tap,
  eyeDisabled,
}: {
  name: string
  subtitle?: string
  avatar: ReactNode
  tap?: 'eye' | 'checklist' | undefined
  eyeDisabled?: boolean
}): React.JSX.Element {
  return (
    <Stack
      backgroundColor="$backgroundSecondary"
      borderBottomColor="$backgroundPrimary"
      borderBottomWidth="$0.5"
    >
      <NavigationBar
        style="chat"
        name={name}
        subtitle={subtitle}
        leftAction={{icon: ChevronLeft, onPress: noop}}
        avatar={avatar}
        rightActions={[
          {icon: EyeShut, onPress: noop, disabled: eyeDisabled},
          {icon: Checklist, onPress: noop},
        ]}
      />
      {/* NavigationBar takes no children, so touches sit over its buttons. */}
      <Tap
        on={tap !== undefined}
        position="absolute"
        top="$5"
        right={tap === 'eye' ? 64 : 16}
        width="$9"
        height="$9"
      />
    </Stack>
  )
}

/** A chat bubble row, aligned by who sent it as `side` sees it. */
export function ChatMessage({
  side,
  from,
  text,
  notice,
}: {
  side: Side
  from: Side
  text: string
  notice?: string
}): React.JSX.Element {
  const outgoing = from === side
  return (
    <XStack mx="$5" mt="$2" flexDirection={outgoing ? 'row-reverse' : 'row'}>
      <Stack maxWidth="80%">
        <ChatBubble
          variant={outgoing ? 'outgoing' : 'incoming'}
          text={text}
          notice={notice}
        />
      </Stack>
    </XStack>
  )
}

export function BotCard(
  props: Omit<VexlbotActionCardProps, 'brandLabel' | 'botLabel'>
): React.JSX.Element {
  return (
    <Arrive>
      <Stack mx="$4" mt="$2">
        <VexlbotActionCard brandLabel="Vexl" botLabel="bot" {...props} />
      </Stack>
    </Arrive>
  )
}

/** The offer the chat is about, pinned under the header. Your offer, so they're the buyer. */
export function OfferStrip({
  side,
  summary,
}: {
  side: Side
  summary: string
}): React.JSX.Element {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      py="$4"
      px="$5"
      backgroundColor="$backgroundSecondary"
    >
      <YStack gap="$1">
        <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
          {side === 'you'
            ? 'You’re selling bitcoin'
            : 'They’re selling bitcoin'}
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          {summary}
        </Typography>
      </YStack>
      <NavButton variant="tetriary" icon={XmarkCancelClose} onPress={noop} />
    </XStack>
  )
}

/** What the offer's author sees under a new request, before accepting it. */
export function WelcomeCard(): React.JSX.Element {
  return (
    <BotCard
      title="Welcome to the chat!"
      description="Before you start the conversation you can check your common friends and offer details."
    >
      <XStack gap="$3">
        <Button flex={1} variant="secondary" size="medium" onPress={noop}>
          Offer details
        </Button>
        <Button flex={1} variant="secondary" size="medium" onPress={noop}>
          Common friends
        </Button>
      </XStack>
    </BotCard>
  )
}

/** The chat footer until the request is accepted: you decide, they wait. */
export function RequestFooter({
  side,
  tapAccept,
}: {
  side: Side
  tapAccept: boolean
}): React.JSX.Element {
  return (
    <YStack px="$5" gap="$5" pt="$6" backgroundColor="$backgroundSecondary">
      {side === 'you' ? (
        <>
          <InfoBox variant="naked">
            To start a conversation, accept the request.
          </InfoBox>
          <XStack width="100%" gap="$3">
            <Button size="large" flex={1} variant="secondary" onPress={noop}>
              Decline
            </Button>
            <Tap on={tapAccept} flex={1}>
              <Button size="large" variant="primary" onPress={noop}>
                Accept
              </Button>
            </Tap>
          </XStack>
        </>
      ) : (
        <>
          <InfoBox variant="naked">
            Waiting for the other person&apos;s response. You will get a
            notification once they reply.
          </InfoBox>
          <Button size="large" variant="destructive" onPress={noop}>
            Cancel request
          </Button>
        </>
      )}
    </YStack>
  )
}
