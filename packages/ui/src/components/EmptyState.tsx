import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {YStack} from '../primitives'
import {Button, type ButtonVariant} from './Button'
import {TitleBlock} from './TitleBlock'
import {Typography} from './Typography'

export interface EmptyStateAction {
  readonly label: string
  readonly onPress: () => void
  readonly variant?: ButtonVariant
  readonly icon?: React.ComponentType<IconProps>
  readonly disabled?: boolean
}

export interface EmptyStateLink {
  readonly label: string
  readonly onPress: () => void
}

export interface EmptyStateProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  readonly title?: React.ReactNode
  readonly description?: React.ReactNode
  readonly graphic?: React.ReactNode
  readonly icon?: React.ComponentType<IconProps>
  readonly action?: EmptyStateAction
  readonly secondaryAction?: EmptyStateAction
  readonly link?: EmptyStateLink
  readonly fullscreen?: boolean
  readonly framed?: boolean
  readonly children?: React.ReactNode
}

function EmptyStateButton({
  action,
  defaultVariant,
}: {
  readonly action: EmptyStateAction
  readonly defaultVariant: ButtonVariant
}): React.JSX.Element {
  return (
    <Button
      alignSelf="stretch"
      size="small"
      variant={action.variant ?? defaultVariant}
      icon={action.icon}
      disabled={action.disabled}
      onPress={action.onPress}
    >
      {action.label}
    </Button>
  )
}

export function EmptyState({
  title,
  description,
  graphic,
  icon: Icon,
  action,
  secondaryAction,
  link,
  fullscreen = false,
  framed = false,
  children,
  ...rest
}: EmptyStateProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack
      alignItems="center"
      gap="$6"
      flex={fullscreen ? 1 : undefined}
      justifyContent={fullscreen ? 'center' : undefined}
      padding={framed ? '$5' : undefined}
      paddingVertical={framed || fullscreen ? undefined : '$8'}
      backgroundColor={framed ? '$backgroundSecondary' : undefined}
      borderRadius={framed ? '$5' : undefined}
      {...rest}
    >
      {graphic ?? null}
      {Icon ? (
        <Icon
          size={getTokens().size.$12.val}
          color={theme.foregroundSecondary.get()}
        />
      ) : null}
      <TitleBlock
        align="center"
        size="large"
        title={title}
        text={description}
      />
      {children}
      {action || secondaryAction ? (
        <YStack alignSelf="stretch" gap="$3">
          {action ? (
            <EmptyStateButton action={action} defaultVariant="tertiary" />
          ) : null}
          {secondaryAction ? (
            <EmptyStateButton
              action={secondaryAction}
              defaultVariant="secondary"
            />
          ) : null}
        </YStack>
      ) : null}
      {link ? (
        <Typography
          role="button"
          variant="micro"
          color="$accentHighlightPrimary"
          onPress={link.onPress}
        >
          {link.label}
        </Typography>
      ) : null}
    </YStack>
  )
}
