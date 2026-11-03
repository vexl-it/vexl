import React from 'react'
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

const BackBar = styled(XStack, {
  name: 'NavigationBarBackBar',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: '$5',
  paddingVertical: '$4',
  gap: '$3',
  alignSelf: 'stretch',
})

const BackSideContainer = styled(XStack, {
  name: 'NavigationBarBackSide',
  alignItems: 'center',
  flexShrink: 0,
  minWidth: '$9',
  zIndex: 1,

  variants: {
    side: {
      left: {},
      right: {
        justifyContent: 'flex-end',
        gap: '$3',
      },
    },
  } as const,
})

const BackCenterContainer = styled(YStack, {
  name: 'NavigationBarBackCenter',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  minWidth: 0,
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
    />
  )
}

export function NavigationBar(props: NavigationBarProps): React.JSX.Element {
  return (
    <NavigationBarFrame>
      {props.style === 'back' ? (
        <BackBar>
          <BackSideContainer side="left">
            {props.leftAction ? (
              <NavAction
                action={props.leftAction}
                defaultVariant="highlighted"
              />
            ) : null}
          </BackSideContainer>
          <BackCenterContainer pointerEvents="none">
            {props.title ? (
              <Typography
                variant="titlesSmall"
                color="$foregroundPrimary"
                textAlign="center"
                maxWidth="100%"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {props.title}
              </Typography>
            ) : null}
          </BackCenterContainer>
          <BackSideContainer side="right">
            {props.rightActions?.map((action, i) => (
              <NavAction key={i} action={action} defaultVariant="normal" />
            ))}
          </BackSideContainer>
        </BackBar>
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
