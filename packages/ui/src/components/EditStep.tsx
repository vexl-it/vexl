import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import type {SpaceTokens} from 'tamagui'

import type {IconProps} from '../icons/types'
import {YStack} from '../primitives'
import {EditRow} from './EditRow'

export interface EditStepProps {
  readonly active: boolean
  readonly title: string
  readonly value?: string
  readonly valueSuffix?: string
  readonly details?: string | readonly string[]
  readonly overline?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly showInitialIcon?: boolean
  readonly invalid?: boolean
  readonly gap?: SpaceTokens
  readonly onEdit?: () => void
  readonly children?: React.ReactNode
}

export function EditStep({
  active,
  title,
  value = '',
  valueSuffix,
  details,
  overline = title,
  icon,
  showInitialIcon,
  invalid,
  gap = '$5',
  onEdit,
  children,
}: EditStepProps): React.JSX.Element {
  if (!active) {
    return (
      <YStack
        borderRadius="$5"
        borderWidth={invalid ? 1 : 0}
        borderColor="$accentHighlightSecondary"
      >
        <EditRow
          state="completed"
          icon={icon}
          overline={overline}
          headline={value}
          headlineSuffix={valueSuffix}
          subheadline={details}
          headlineColor={invalid ? '$accentHighlightSecondary' : undefined}
          onPress={onEdit}
        />
      </YStack>
    )
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <EditRow
        state="initial"
        headline={title}
        showInitialIcon={showInitialIcon}
      />
      <YStack gap={gap} paddingVertical="$5">
        {children}
      </YStack>
    </Animated.View>
  )
}
