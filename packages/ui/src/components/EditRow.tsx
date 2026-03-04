import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PencilWriteEdit} from '../icons/PencilWriteEdit'
import {QuestionmarkCircle} from '../icons/QuestionmarkCircle'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack, YStack} from '../primitives'
import type {AvatarProps} from './Avatar'
import {Avatar} from './Avatar'

export type EditRowState = 'initial' | 'editing' | 'completed' | 'profile'

const EditRowFrame = styled(XStack, {
  name: 'EditRow',
  alignItems: 'center',
  borderRadius: '$5',
  gap: '$4',

  variants: {
    frameType: {
      transparent: {
        paddingLeft: '$3',
        paddingRight: '$4',
        paddingVertical: '$3',
      },
      filled: {
        backgroundColor: '$backgroundSecondary',
        padding: '$3',
      },
    },
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

const IconBox = styled(Stack, {
  name: 'EditRowIconBox',
  width: '$9',
  height: '$9',
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
})

const OptionalTag = styled(XStack, {
  name: 'EditRowOptionalTag',
  backgroundColor: '$backgroundTertiary',
  borderRadius: '$3',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  justifyContent: 'center',
})

const OverlineText = styled(SizableText, {
  name: 'EditRowOverline',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
  numberOfLines: 1,
})

const HeadlineText = styled(SizableText, {
  name: 'EditRowHeadline',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  lineHeight: '$2',
  color: '$foregroundPrimary',
  numberOfLines: 2,
})

const OptionalLabelText = styled(SizableText, {
  name: 'EditRowOptionalLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundPrimary',
})

interface EditRowBaseProps {
  readonly headline: string
  readonly overline?: string
  readonly optionalLabel?: string
  readonly showEditButton?: boolean
  readonly onPress?: () => void
}

interface EditRowIconProps extends EditRowBaseProps {
  readonly state: 'initial' | 'editing' | 'completed'
  readonly icon?: React.ComponentType<IconProps>
  readonly avatar?: never
}

interface EditRowProfileProps extends EditRowBaseProps {
  readonly state: 'profile'
  readonly avatar: Omit<AvatarProps, 'size' | 'customSize'>
  readonly icon?: never
}

export type EditRowProps = EditRowIconProps | EditRowProfileProps

export function EditRow({
  state,
  headline,
  overline,
  optionalLabel,
  showEditButton = state !== 'initial',
  onPress,
  ...rest
}: EditRowProps): React.JSX.Element {
  const icon = 'icon' in rest ? rest.icon : undefined
  const avatar = 'avatar' in rest ? rest.avatar : undefined
  const theme = useTheme()
  const iconBoxSize = getTokens().size.$9.val

  const isInitial = state === 'initial'
  const isProfile = state === 'profile'
  const Icon = !isProfile ? icon : undefined

  const foregroundColor = theme.foregroundPrimary.val

  const iconBoxBg = (() => {
    switch (state) {
      case 'completed':
        return theme.greenForeground.val
      case 'editing':
      case 'profile':
        return theme.backgroundTertiary.val
      case 'initial':
        return theme.backgroundSecondary.val
    }
  })()

  const leadingIcon = (() => {
    switch (state) {
      case 'completed':
        return (
          <RadiobuttonCircleFilled
            color={theme.backgroundSecondary.val}
            size={24}
          />
        )
      case 'editing':
      case 'profile':
        return Icon ? <Icon color={foregroundColor} size={24} /> : null
      case 'initial':
        return <QuestionmarkCircle color={foregroundColor} size={24} />
    }
  })()

  return (
    <EditRowFrame
      frameType={isInitial ? 'transparent' : 'filled'}
      pressable={showEditButton}
      onPress={showEditButton ? onPress : undefined}
    >
      {isProfile && avatar ? (
        <Avatar customSize={iconBoxSize} {...avatar} />
      ) : (
        <IconBox backgroundColor={iconBoxBg}>{leadingIcon}</IconBox>
      )}
      <YStack flex={1} gap={overline ? '$2' : undefined}>
        {overline ? <OverlineText>{overline}</OverlineText> : null}
        <HeadlineText>{headline}</HeadlineText>
      </YStack>
      {optionalLabel ? (
        <OptionalTag>
          <OptionalLabelText>{optionalLabel}</OptionalLabelText>
        </OptionalTag>
      ) : null}
      {showEditButton ? (
        <IconBox backgroundColor="$backgroundTertiary">
          <PencilWriteEdit color={foregroundColor} size={24} />
        </IconBox>
      ) : null}
    </EditRowFrame>
  )
}
