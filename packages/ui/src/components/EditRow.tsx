import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PencilWriteEdit} from '../icons/PencilWriteEdit'
import {QuestionmarkCircle} from '../icons/QuestionmarkCircle'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import type {IconProps} from '../icons/types'
import {Stack, XStack, YStack} from '../primitives'
import type {AvatarProps} from './Avatar'
import {Avatar} from './Avatar'
import {Typography} from './Typography'

export type EditRowState = 'initial' | 'editing' | 'completed' | 'profile'

const EditRowFrame = styled(XStack, {
  name: 'EditRow',
  alignItems: 'center',
  borderRadius: '$5',
  overflow: 'hidden',
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

  variants: {
    tone: {
      tertiary: {backgroundColor: '$backgroundTertiary'},
      secondary: {backgroundColor: '$backgroundSecondary'},
      green: {backgroundColor: '$greenForeground'},
    },
  } as const,
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

interface EditRowBaseProps {
  readonly headline: string
  readonly headlineSuffix?: string
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

function HeadlineWithSuffix({
  headline,
  suffix,
}: {
  readonly headline: string
  readonly suffix: string
}): React.JSX.Element {
  const lines = headline.split('\n')
  const lastIndex = lines.length - 1

  return (
    <YStack>
      {lines.map((line, i) =>
        i === lastIndex ? (
          <XStack key={i} gap="$2" alignItems="center">
            <Typography
              variant="descriptionBold"
              color="$foregroundPrimary"
              numberOfLines={1}
              flexShrink={1}
            >
              {line}
            </Typography>
            <Typography
              variant="descriptionBold"
              color="$foregroundPrimary"
              flexShrink={0}
            >
              {suffix}
            </Typography>
          </XStack>
        ) : (
          <Typography
            key={i}
            variant="descriptionBold"
            color="$foregroundPrimary"
            numberOfLines={1}
          >
            {line}
          </Typography>
        )
      )}
    </YStack>
  )
}

export function EditRow({
  state,
  headline,
  headlineSuffix,
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

  const iconBoxTone: 'tertiary' | 'secondary' | 'green' = (() => {
    switch (state) {
      case 'completed':
        return Icon ? 'tertiary' : 'green'
      case 'editing':
      case 'profile':
        return 'tertiary'
      case 'initial':
        return 'secondary'
    }
  })()

  const leadingIcon = (() => {
    switch (state) {
      case 'completed':
        return Icon ? (
          <Icon color={foregroundColor} size={24} />
        ) : (
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
        <IconBox tone={iconBoxTone}>{leadingIcon}</IconBox>
      )}
      <YStack flex={1} gap={overline ? '$2' : undefined}>
        {overline ? (
          <Typography
            variant="micro"
            color="$foregroundSecondary"
            numberOfLines={1}
          >
            {overline}
          </Typography>
        ) : null}
        {headlineSuffix ? (
          <HeadlineWithSuffix headline={headline} suffix={headlineSuffix} />
        ) : (
          <Typography
            variant={isInitial ? 'paragraphDemibold' : 'descriptionBold'}
            color="$foregroundPrimary"
            numberOfLines={2}
          >
            {headline}
          </Typography>
        )}
      </YStack>
      {optionalLabel ? (
        <OptionalTag>
          <Typography variant="micro" color="$foregroundPrimary">
            {optionalLabel}
          </Typography>
        </OptionalTag>
      ) : null}
      {showEditButton ? (
        <IconBox tone="tertiary">
          <PencilWriteEdit color={foregroundColor} size={24} />
        </IconBox>
      ) : null}
    </EditRowFrame>
  )
}
