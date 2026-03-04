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

  variants: {
    scrolled: {
      true: {
        backgroundColor: '$backgroundSecondary',
      },
      false: {
        backgroundColor: '$transparent',
      },
    },
  } as const,

  defaultVariants: {
    scrolled: false,
  },
})

const MainBar = styled(XStack, {
  name: 'NavigationBarMainBar',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '$5',
  alignSelf: 'stretch',
})

const MainTitleArea = styled(XStack, {
  name: 'NavigationBarMainTitleArea',
  flex: 1,
  alignItems: 'center',
  paddingVertical: '$1',
})

const MainTitle = styled(SizableText, {
  name: 'NavigationBarMainTitle',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$5',
  letterSpacing: '$5',
  color: '$foregroundPrimary',
  flex: 1,
})

const MainIconsArea = styled(XStack, {
  name: 'NavigationBarMainIconsArea',
  alignItems: 'center',
  gap: '$5',
})

const ActionButton = styled(Stack, {
  name: 'NavigationBarActionButton',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  width: '$8',
  height: '$8',

  pressStyle: {
    opacity: 0.7,
  },
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

interface NavigationBarBaseProps {
  readonly scrolled?: boolean
}

interface NavigationBarMainProps extends NavigationBarBaseProps {
  readonly style: 'main'
  readonly title: string
  readonly rightActions?: readonly NavigationBarAction[]
}

interface NavigationBarBackProps extends NavigationBarBaseProps {
  readonly style: 'back'
  readonly title?: string
  readonly leftAction?: NavigationBarAction
  readonly rightActions?: readonly NavigationBarAction[]
}

interface NavigationBarChatProps extends NavigationBarBaseProps {
  readonly style: 'chat'
  readonly name: string
  readonly subtitle?: string
  readonly avatar?: React.ReactNode
  readonly leftAction?: NavigationBarAction
  readonly rightActions?: readonly NavigationBarAction[]
  readonly onPress?: () => void
}

export type NavigationBarProps =
  | NavigationBarMainProps
  | NavigationBarBackProps
  | NavigationBarChatProps

export type NavigationBarStyle = NavigationBarProps['style']

function ActionIcon({
  action,
}: {
  readonly action: NavigationBarAction
}): React.JSX.Element {
  const theme = useTheme()
  const Icon = action.icon

  return (
    <ActionButton onPress={action.onPress}>
      <Icon
        color={theme.foregroundPrimary.val}
        size={getTokens().size.$7.val}
      />
    </ActionButton>
  )
}

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
  const {scrolled = false} = props

  return (
    <NavigationBarFrame scrolled={scrolled}>
      {props.style === 'main' ? (
        <MainBar>
          <MainTitleArea>
            <MainTitle>{props.title}</MainTitle>
          </MainTitleArea>
          {props.rightActions && props.rightActions.length > 0 ? (
            <MainIconsArea>
              {props.rightActions.map((action, i) => (
                <ActionIcon key={i} action={action} />
              ))}
            </MainIconsArea>
          ) : null}
        </MainBar>
      ) : props.style === 'back' ? (
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
