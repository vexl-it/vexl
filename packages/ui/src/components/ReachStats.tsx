import React, {useMemo} from 'react'
import {getTokens, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack, YStack} from '../primitives'
import {Button} from './Button'

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
}

export function ReachStats({
  subtitle,
  headline,
  steps,
  buttonLabel,
  onButtonPress,
}: ReachStatsProps): React.JSX.Element {
  const theme = useTheme()
  const stepIconSize = useMemo(() => getTokens().size.$5.val, [])
  const activeIconColor = useMemo(() => theme.foregroundPrimary.val, [theme])
  const defaultIconColor = useMemo(() => theme.foregroundTertiary.val, [theme])

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      padding="$4"
      borderRadius="$5"
      justifyContent="center"
    >
      <YStack gap="$5" alignItems="center" justifyContent="center">
        <YStack gap="$3" alignSelf="stretch">
          <SizableText
            fontFamily="$body"
            fontSize="$2"
            fontWeight="500"
            letterSpacing="$2"
            color="$foregroundSecondary"
          >
            {subtitle}
          </SizableText>
          <SizableText
            fontFamily="$heading"
            fontSize="$2"
            fontWeight="700"
            letterSpacing="$2"
            color="$foregroundPrimary"
          >
            {headline}
          </SizableText>
        </YStack>

        {steps.length > 0 ? (
          <XStack gap="$2" alignSelf="stretch">
            {steps.map((step) => {
              const Icon = step.icon
              const textColor = step.active
                ? '$foregroundPrimary'
                : '$foregroundTertiary'
              const iconColor = step.active ? activeIconColor : defaultIconColor

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
                    <SizableText
                      fontFamily="$body"
                      fontSize="$1"
                      fontWeight="500"
                      letterSpacing="$1"
                      color={textColor}
                    >
                      {step.label}
                    </SizableText>
                    <XStack gap="$1" alignItems="center">
                      <Icon size={stepIconSize} color={iconColor} />
                      <SizableText
                        fontFamily="$body"
                        fontSize="$1"
                        fontWeight="500"
                        letterSpacing="$1"
                        color={textColor}
                      >
                        {step.range}
                      </SizableText>
                    </XStack>
                  </YStack>
                </YStack>
              )
            })}
          </XStack>
        ) : null}

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
