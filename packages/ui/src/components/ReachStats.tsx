import {Array, pipe} from 'effect'
import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {InfoCircle} from '../icons'
import type {IconProps} from '../icons/types'
import {Stack, XStack, YStack} from '../primitives'
import {Button} from './Button'
import {Typography} from './Typography'
import {getReachPressProps} from './getReachPressProps'

export interface ReachStatsStep {
  readonly label: string
  readonly range: string
  readonly icon: React.ComponentType<IconProps>
  readonly active: boolean
}

export interface ReachStatsProps {
  readonly subtitle: string
  readonly headline: string
  readonly steps: readonly ReachStatsStep[]
  readonly buttonLabel: string
  readonly onButtonPress?: () => void
  readonly onReachPress?: () => void
}

export function ReachStats({
  subtitle,
  headline,
  steps,
  buttonLabel,
  onButtonPress,
  onReachPress,
}: ReachStatsProps): React.JSX.Element {
  const theme = useTheme()
  const stepIconSize = getTokens().size.$5.val
  const activeIconColor = theme.foregroundPrimary.get()
  const defaultIconColor = theme.foregroundTertiary.get()
  const accessibilityLabel = pipe(
    steps,
    Array.map((step) => `${step.label} ${step.range}`),
    Array.prepend(`${subtitle}. ${headline}`),
    Array.join('. ')
  )

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      padding="$4"
      borderRadius="$5"
      justifyContent="center"
    >
      <YStack gap="$5" alignItems="center" justifyContent="center">
        <YStack
          gap="$5"
          alignSelf="stretch"
          {...getReachPressProps(onReachPress, accessibilityLabel)}
        >
          <YStack gap="$3" alignSelf="stretch">
            <Typography variant="description" color="$foregroundSecondary">
              {subtitle}
            </Typography>
            <XStack ai="center" gap="$2">
              <Typography
                variant="tabLargeBold"
                color="$foregroundPrimary"
                flexShrink={1}
              >
                {headline}
              </Typography>
              {!!onReachPress && (
                <InfoCircle size={stepIconSize} color={defaultIconColor} />
              )}
            </XStack>
          </YStack>

          {steps.length > 0 ? (
            <XStack gap="$2" alignSelf="stretch">
              {steps.map((step) => {
                const Icon = step.icon
                const textColor = step.active
                  ? '$foregroundPrimary'
                  : '$foregroundTertiary'
                const iconColor = step.active
                  ? activeIconColor
                  : defaultIconColor

                return (
                  <YStack key={step.label} flex={1} gap="$3">
                    <Stack
                      height="$2"
                      borderRadius="$11"
                      backgroundColor={
                        step.active
                          ? '$foregroundPrimary'
                          : '$foregroundSecondary'
                      }
                      alignSelf="stretch"
                    />
                    <YStack gap="$0">
                      <Typography variant="micro" color={textColor}>
                        {step.label}
                      </Typography>
                      <XStack gap="$1" alignItems="center">
                        <Icon size={stepIconSize} color={iconColor} />
                        <Typography variant="micro" color={textColor}>
                          {step.range}
                        </Typography>
                      </XStack>
                    </YStack>
                  </YStack>
                )
              })}
            </XStack>
          ) : null}
        </YStack>

        <Button
          variant="secondary"
          size="small"
          alignSelf="stretch"
          onPress={onButtonPress}
        >
          {buttonLabel}
        </Button>
      </YStack>
    </YStack>
  )
}
