import {Array, pipe} from 'effect'
import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {PencilWriteEdit} from '../icons/PencilWriteEdit'
import {QuestionmarkCircle} from '../icons/QuestionmarkCircle'
import type {IconProps} from '../icons/types'
import {XStack, YStack} from '../primitives'
import type {AvatarProps} from './Avatar'
import {Avatar} from './Avatar'
import {CompletedIconBox, IconBox} from './IconBox'
import {Typography, type TypographyProps} from './Typography'

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
  readonly subheadline?: string | readonly string[]
  readonly overline?: string
  readonly optionalLabel?: string
  readonly headlineColor?: TypographyProps['color']
  readonly showEditButton?: boolean
  readonly showInitialIcon?: boolean
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
  headlineColor,
  suffix,
}: {
  readonly headline: string
  readonly headlineColor: TypographyProps['color']
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
              color={headlineColor}
              numberOfLines={1}
              flexShrink={1}
            >
              {line}
            </Typography>
            <Typography
              variant="descriptionBold"
              color={headlineColor}
              flexShrink={0}
            >
              {suffix}
            </Typography>
          </XStack>
        ) : (
          <Typography
            key={i}
            variant="descriptionBold"
            color={headlineColor}
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
  subheadline,
  overline,
  optionalLabel,
  headlineColor = '$foregroundPrimary',
  showEditButton = state !== 'initial',
  showInitialIcon = true,
  onPress,
  ...rest
}: EditRowProps): React.JSX.Element {
  const icon = 'icon' in rest ? rest.icon : undefined
  const avatar = 'avatar' in rest ? rest.avatar : undefined
  const theme = useTheme()
  const sizes = getTokens().size

  const isInitial = state === 'initial'
  const isProfile = state === 'profile'
  const Icon = !isProfile ? icon : undefined

  const foregroundColor = theme.foregroundPrimary.get()

  const iconSize = sizes.$7.val

  const leadingIcon = (() => {
    switch (state) {
      case 'completed':
        return Icon ? (
          <IconBox tone="tertiary">
            <Icon color={foregroundColor} size={iconSize} />
          </IconBox>
        ) : (
          <CompletedIconBox />
        )
      case 'editing':
      case 'profile':
        return (
          <IconBox tone="tertiary">
            {Icon ? <Icon color={foregroundColor} size={iconSize} /> : null}
          </IconBox>
        )
      case 'initial':
        return (
          <IconBox tone="secondary">
            <QuestionmarkCircle color={foregroundColor} size={iconSize} />
          </IconBox>
        )
    }
  })()
  const showLeadingIcon = isProfile || !isInitial || showInitialIcon
  const subheadlines = pipe(
    typeof subheadline === 'string' ? [subheadline] : (subheadline ?? []),
    Array.filter((line) => line !== '')
  )

  return (
    <EditRowFrame
      frameType={isInitial ? 'transparent' : 'filled'}
      pressable={showEditButton}
      onPress={showEditButton ? onPress : undefined}
    >
      {showLeadingIcon ? (
        isProfile && avatar ? (
          <Avatar customSize={sizes.$9.val} {...avatar} />
        ) : (
          leadingIcon
        )
      ) : null}
      <YStack
        flex={1}
        gap={overline || subheadlines.length > 0 ? '$2' : undefined}
      >
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
          <HeadlineWithSuffix
            headline={headline}
            headlineColor={headlineColor}
            suffix={headlineSuffix}
          />
        ) : (
          <Typography
            variant={isInitial ? 'paragraphDemibold' : 'descriptionBold'}
            color={headlineColor}
            numberOfLines={2}
          >
            {headline}
          </Typography>
        )}
        {subheadlines.map((line, i) => (
          <Typography
            key={i}
            variant="micro"
            color="$foregroundPrimary"
            numberOfLines={1}
          >
            {line}
          </Typography>
        ))}
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
          <PencilWriteEdit color={foregroundColor} size={iconSize} />
        </IconBox>
      ) : null}
    </EditRowFrame>
  )
}
