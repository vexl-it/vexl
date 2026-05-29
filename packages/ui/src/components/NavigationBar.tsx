import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack, YStack} from '../primitives'
import {NavButton, type NavButtonVariant} from './NavButton'
import {Typography} from './Typography'

export interface NavigationBarAction {
  readonly icon: React.ComponentType<IconProps>
  readonly onPress: () => void
  readonly variant?: NavButtonVariant
  readonly disabled?: boolean
}

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

const BackTitle = styled(SizableText, {
  name: 'NavigationBarBackTitle',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$5',
  letterSpacing: '$5',
  color: '$foregroundPrimary',
  textAlign: 'center',
  maxWidth: '100%',
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

const ChatSubtitleRow = styled(XStack, {
  name: 'NavigationBarChatSubtitle',
  alignItems: 'flex-end',
  gap: '$1',
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
  readonly avatar?: React.ReactNode
  readonly leftAction?: NavigationBarAction
  readonly rightActions?: readonly NavigationBarAction[]
  readonly onPress?: () => void
}

export type NavigationBarProps = NavigationBarBackProps | NavigationBarChatProps

export type NavigationBarStyle = NavigationBarProps['style']

function HighlightedNavAction({
  action,
}: {
  readonly action: NavigationBarAction
}): React.JSX.Element {
  return (
    <NavButton
      variant="highlighted"
      icon={action.icon}
      onPress={action.onPress}
      disabled={action.disabled}
    />
  )
}

function RightNavAction({
  action,
}: {
  readonly action: NavigationBarAction
}): React.JSX.Element {
  return (
    <NavButton
      variant={action.variant ?? 'normal'}
      icon={action.icon}
      onPress={action.onPress}
      disabled={action.disabled}
    />
  )
}

export function NavigationBar(props: NavigationBarProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <NavigationBarFrame>
      {props.style === 'back' ? (
        <BackBar>
          <BackSideContainer side="left">
            {props.leftAction ? (
              <HighlightedNavAction action={props.leftAction} />
            ) : null}
          </BackSideContainer>
          <BackCenterContainer pointerEvents="none">
            {props.title ? (
              <BackTitle numberOfLines={1} ellipsizeMode="tail">
                {props.title}
              </BackTitle>
            ) : null}
          </BackCenterContainer>
          <BackSideContainer side="right">
            {props.rightActions?.map((action, i) => (
              <RightNavAction key={i} action={action} />
            ))}
          </BackSideContainer>
        </BackBar>
      ) : (
        <ChatBar>
          {props.leftAction ? (
            <HighlightedNavAction action={props.leftAction} />
          ) : null}
          <ChatPressableArea onPress={props.onPress}>
            {props.avatar}
            <ChatInfoColumn>
              <Typography variant="paragraphSmall" color="$foregroundPrimary">
                {props.name}
              </Typography>
              {props.subtitle ? (
                <ChatSubtitleRow>
                  <PeopleUsers
                    color={theme.foregroundSecondary.get()}
                    size={getTokens().size.$5.val}
                  />
                  <Typography variant="micro" color="$foregroundSecondary">
                    {props.subtitle}
                  </Typography>
                </ChatSubtitleRow>
              ) : null}
            </ChatInfoColumn>
          </ChatPressableArea>
          {props.rightActions?.map((action, i) => (
            <RightNavAction key={i} action={action} />
          ))}
        </ChatBar>
      )}
    </NavigationBarFrame>
  )
}
