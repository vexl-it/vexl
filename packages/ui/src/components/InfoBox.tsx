import React from 'react'
import {styled, useTheme} from 'tamagui'

import {typographyVariantStyles} from '../config/fonts'
import {ChevronRight} from '../icons/ChevronRight'
import {InfoCircle} from '../icons/InfoCircle'
import type {IconProps} from '../icons/types'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {Stack, XStack, YStack} from '../primitives'
import {Button} from './Button'
import {Loader} from './Loader'
import {NavButton} from './NavButton'
import {Typography} from './Typography'

export type InfoBoxVariant =
  | 'default'
  | 'yellow'
  | 'pink'
  | 'tertiary'
  | 'error'
  | 'naked'

const InfoBoxFrame = styled(XStack, {
  name: 'InfoBox',
  alignItems: 'flex-start',
  gap: '$2',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  borderRadius: '$3',
  backgroundColor: '$backgroundSecondary',

  variants: {
    variant: {
      default: {
        backgroundColor: '$backgroundSecondary',
      },
      yellow: {
        backgroundColor: '$accentYellowSecondary',
      },
      pink: {
        backgroundColor: '$pinkBackground',
      },
      tertiary: {
        backgroundColor: '$backgroundTertiary',
      },
      error: {
        backgroundColor: '$redBackground',
      },
      naked: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

const themeColorKeys = {
  default: 'foregroundSecondary',
  yellow: 'accentHighlightSecondary',
  pink: 'pinkForeground',
  tertiary: 'foregroundSecondary',
  error: 'white100',
  naked: 'foregroundSecondary',
} as const

const textColors = {
  default: '$foregroundSecondary',
  yellow: '$accentHighlightSecondary',
  pink: '$pinkForeground',
  tertiary: '$foregroundSecondary',
  error: '$white100',
  naked: '$foregroundSecondary',
} as const

const firstLineHeight = typographyVariantStyles.description.lineHeight

export interface InfoBoxAction {
  readonly label: string
  readonly onPress: () => void
}

type InfoBoxFrameProps = React.ComponentProps<typeof InfoBoxFrame>

export interface InfoBoxProps extends Omit<
  InfoBoxFrameProps,
  'children' | 'variant' | 'onPress'
> {
  readonly children: React.ReactNode
  readonly variant?: InfoBoxVariant
  readonly icon?: React.ComponentType<IconProps>
  readonly iconSize?: number
  readonly loading?: boolean
  readonly onPress?: () => void
  readonly action?: InfoBoxAction
  readonly onClose?: () => void
}

export function InfoBox({
  children,
  variant = 'default',
  icon: Icon = InfoCircle,
  iconSize = 18,
  loading = false,
  onPress,
  action,
  onClose,
  ...rest
}: InfoBoxProps): React.JSX.Element {
  const theme = useTheme()
  const foregroundColor = theme[themeColorKeys[variant]].get()

  return (
    <InfoBoxFrame
      variant={variant}
      onPress={onPress}
      pressStyle={onPress ? {opacity: 0.7} : undefined}
      role={onPress ? 'button' : undefined}
      {...rest}
    >
      <Stack height={firstLineHeight} justifyContent="center">
        {loading ? (
          <Loader color={foregroundColor} size="small" />
        ) : (
          <Icon color={foregroundColor} size={iconSize} />
        )}
      </Stack>
      <YStack
        flex={1}
        gap="$4"
        justifyContent="center"
        minHeight={firstLineHeight}
      >
        {typeof children === 'string' ? (
          <Typography color={textColors[variant]} variant="description">
            {children}
          </Typography>
        ) : (
          children
        )}
        {action ? (
          <Button onPress={action.onPress} size="medium" variant="secondary">
            {action.label}
          </Button>
        ) : null}
      </YStack>
      {onPress ? (
        <Stack height={firstLineHeight} justifyContent="center">
          <ChevronRight color={foregroundColor} size={iconSize} />
        </Stack>
      ) : null}
      {onClose ? (
        <NavButton
          icon={XmarkCancelClose}
          onPress={onClose}
          variant="normal"
          width="$7"
          height="$7"
        />
      ) : null}
    </InfoBoxFrame>
  )
}
