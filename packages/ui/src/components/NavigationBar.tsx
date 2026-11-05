import React, {useState} from 'react'
import {styled} from 'tamagui'

import type {IconProps} from '../icons/types'
import {Stack, XStack, YStack} from '../primitives'
import {CommonFriendsSummary} from './CommonFriendsSummary'
import {NavButton, type NavButtonVariant} from './NavButton'
import {Typography} from './Typography'

interface NavigationBarActionBase {
  readonly onPress: () => void
  readonly variant?: NavButtonVariant
  readonly disabled?: boolean
}

interface NavigationBarIconAction extends NavigationBarActionBase {
  readonly icon: React.ComponentType<IconProps>
  readonly label?: never
  readonly accessibilityLabel?: string
}

interface NavigationBarTextAction extends NavigationBarActionBase {
  readonly label: string
  readonly icon?: never
}

export type NavigationBarAction =
  | NavigationBarIconAction
  | NavigationBarTextAction

const NavigationBarFrame = styled(Stack, {
  name: 'NavigationBar',
  alignSelf: 'stretch',
})

const BackBarFrame = styled(XStack, {
  name: 'NavigationBarBackBar',
  alignItems: 'center',
  paddingHorizontal: '$5',
  paddingVertical: '$4',
  gap: '$3',
  alignSelf: 'stretch',
})

const BackSideContainer = styled(XStack, {
  name: 'NavigationBarBackSide',
  alignItems: 'center',
  flexGrow: 1,
  flexBasis: 0,

  variants: {
    side: {
      left: {},
      right: {
        justifyContent: 'flex-end',
      },
    },
  } as const,
})

const ChatBar = styled(XStack, {
  name: 'NavigationBarChatBar',
  alignItems: 'center',
  paddingHorizontal: '$5',
  paddingVertical: '$4',
  gap: '$3',
  alignSelf: 'stretch',
})

const ChatPressableArea = styled(XStack, {
  name: 'NavigationBarChatPressableArea',
  flex: 1,
  alignItems: 'center',
  gap: '$3',

  pressStyle: {
    opacity: 0.7,
  },
})

const ChatInfoColumn = styled(YStack, {
  name: 'NavigationBarChatInfo',
  alignSelf: 'stretch',
  flex: 1,
  gap: '$1',
  justifyContent: 'flex-end',
})

interface NavigationBarBackProps {
  readonly style: 'back'
  readonly title?: string
  readonly leftAction?: NavigationBarAction
  readonly rightActions?: readonly NavigationBarAction[]
}

interface NavigationBarChatProps {
  readonly style: 'chat'
  readonly name: string
  readonly subtitle?: string
  readonly trustedFriends?: string
  readonly avatar?: React.ReactNode
  readonly leftAction?: NavigationBarAction
  readonly rightActions?: readonly NavigationBarAction[]
  readonly onPress?: () => void
}

export type NavigationBarProps = NavigationBarBackProps | NavigationBarChatProps

export type NavigationBarStyle = NavigationBarProps['style']

function NavAction({
  action,
  defaultVariant,
}: {
  readonly action: NavigationBarAction
  readonly defaultVariant: NavButtonVariant
}): React.JSX.Element {
  const variant = action.variant ?? defaultVariant

  if (action.label !== undefined) {
    return (
      <NavButton
        type="text"
        variant={variant}
        onPress={action.onPress}
        disabled={action.disabled}
      >
        {action.label}
      </NavButton>
    )
  }

  return (
    <NavButton
      variant={variant}
      icon={action.icon}
      onPress={action.onPress}
      disabled={action.disabled}
      aria-label={action.accessibilityLabel}
    />
  )
}

// Both sides get the wider side's content width so the title stays centred on
// screen and truncates between the actions instead of overlapping them.
function BackBar({
  title,
  leftAction,
  rightActions,
}: NavigationBarBackProps): React.JSX.Element {
  const [leftWidth, setLeftWidth] = useState(0)
  const [rightWidth, setRightWidth] = useState(0)
  const sideWidth = Math.max(leftWidth, rightWidth)

  return (
    <BackBarFrame>
      <BackSideContainer side="left" minWidth={sideWidth}>
        <XStack
          onLayout={(event) => {
            setLeftWidth(event.nativeEvent.layout.width)
          }}
        >
          {leftAction ? (
            <NavAction action={leftAction} defaultVariant="highlighted" />
          ) : null}
        </XStack>
      </BackSideContainer>
      {title ? (
        <Typography
          variant="titlesSmall"
          color="$foregroundPrimary"
          textAlign="center"
          flexShrink={1}
          minWidth={0}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Typography>
      ) : null}
      <BackSideContainer side="right" minWidth={sideWidth}>
        <XStack
          gap="$3"
          onLayout={(event) => {
            setRightWidth(event.nativeEvent.layout.width)
          }}
        >
          {rightActions?.map((action, i) => (
            <NavAction key={i} action={action} defaultVariant="normal" />
          ))}
        </XStack>
      </BackSideContainer>
    </BackBarFrame>
  )
}

export function NavigationBar(props: NavigationBarProps): React.JSX.Element {
  return (
    <NavigationBarFrame>
      {props.style === 'back' ? (
        <BackBar {...props} />
      ) : (
        <ChatBar>
          {props.leftAction ? (
            <NavAction action={props.leftAction} defaultVariant="highlighted" />
          ) : null}
          <ChatPressableArea onPress={props.onPress}>
            {props.avatar}
            <ChatInfoColumn>
              <Typography
                variant="paragraphSmall"
                color="$foregroundPrimary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {props.name}
              </Typography>
              <CommonFriendsSummary
                commonFriends={props.subtitle}
                trustedFriends={props.trustedFriends}
              />
            </ChatInfoColumn>
          </ChatPressableArea>
          {props.rightActions?.map((action, i) => (
            <NavAction key={i} action={action} defaultVariant="normal" />
          ))}
        </ChatBar>
      )}
    </NavigationBarFrame>
  )
}
