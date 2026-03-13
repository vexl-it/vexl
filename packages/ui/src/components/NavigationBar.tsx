import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PeopleUsers} from '../icons/PeopleUsers'
import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack, YStack} from '../primitives'
import {NavButton} from './NavButton'

export interface NavigationBarAction {
  readonly icon: React.ComponentType<IconProps>
  readonly onPress: () => void
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
  alignSelf: 'stretch',
})

const BackSideContainer = styled(XStack, {
  name: 'NavigationBarBackSide',
  alignItems: 'center',
  flex: 1,

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
})

const BackTitle = styled(SizableText, {
  name: 'NavigationBarBackTitle',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$5',
  letterSpacing: '$5',
  color: '$foregroundPrimary',
  textAlign: 'center',
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
  flex: 1,
  gap: '$1',
})

const ChatName = styled(SizableText, {
  name: 'NavigationBarChatName',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$3',
  letterSpacing: '$3',
  color: '$foregroundPrimary',
  numberOfLines: 1,
})

const ChatSubtitleRow = styled(XStack, {
  name: 'NavigationBarChatSubtitle',
  alignItems: 'center',
  gap: '$1',
})

const ChatSubtitleText = styled(SizableText, {
  name: 'NavigationBarChatSubtitleText',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$foregroundSecondary',
  flex: 1,
  numberOfLines: 1,
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
    />
  )
}

function NormalNavAction({
  action,
}: {
  readonly action: NavigationBarAction
}): React.JSX.Element {
  return (
    <NavButton variant="normal" icon={action.icon} onPress={action.onPress} />
  )
}

function ChatSubtitleIcon(): React.JSX.Element {
  const theme = useTheme()

  return (
    <PeopleUsers
      color={theme.foregroundSecondary.val}
      size={getTokens().size.$5.val}
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
              <HighlightedNavAction action={props.leftAction} />
            ) : null}
          </BackSideContainer>
          <BackCenterContainer>
            {props.title ? <BackTitle>{props.title}</BackTitle> : null}
          </BackCenterContainer>
          <BackSideContainer side="right">
            {props.rightActions?.map((action, i) => (
              <NormalNavAction key={i} action={action} />
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
              <ChatName>{props.name}</ChatName>
              {props.subtitle ? (
                <ChatSubtitleRow>
                  <ChatSubtitleIcon />
                  <ChatSubtitleText>{props.subtitle}</ChatSubtitleText>
                </ChatSubtitleRow>
              ) : null}
            </ChatInfoColumn>
          </ChatPressableArea>
          {props.rightActions?.map((action, i) => (
            <NormalNavAction key={i} action={action} />
          ))}
        </ChatBar>
      )}
    </NavigationBarFrame>
  )
}
