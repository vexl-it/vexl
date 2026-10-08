import {
  Avatar,
  avatarsSvg,
  ChatBubble,
  Checklist,
  ChevronLeft,
  EyeShut,
  NavigationBar,
  Stack,
  XStack,
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
  avatar,
  tap,
  eyeDisabled,
}: {
  name: string
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
        subtitle="3 common"
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
