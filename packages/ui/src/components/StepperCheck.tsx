import React from 'react'
import {styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import {RadiobuttonCircleEmpty} from '../icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export const StepperCheckContainer = styled(YStack, {
  name: 'StepperCheckContainer',
  backgroundColor: '$backgroundSecondary',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  borderRadius: '$5',
})

const StepperCheckFrame = styled(XStack, {
  name: 'StepperCheck',
  alignItems: 'center',
  gap: '$4',

  variants: {
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

export interface StepperCheckProps {
  readonly selected?: boolean
  readonly last?: boolean
  readonly label: string
  readonly note?: string
  readonly onPress?: () => void
}

export function StepperCheck({
  selected = false,
  last = false,
  label,
  note,
  onPress,
}: StepperCheckProps): React.JSX.Element {
  const theme = useTheme()

  const isPressable = !selected

  const iconColor = selected
    ? theme.accentHighlightSecondary.get()
    : theme.foregroundTertiary.get()

  const chevronColor = theme.foregroundTertiary.get()

  return (
    <StepperCheckFrame
      pressable={isPressable}
      onPress={isPressable ? onPress : undefined}
    >
      <YStack
        alignItems="center"
        alignSelf="stretch"
        {...(last
          ? {paddingVertical: '$3', gap: '$0'}
          : {paddingTop: '$3', gap: '$3'})}
      >
        {selected ? (
          <RadiobuttonCircleFilled color={iconColor} size={24} />
        ) : (
          <RadiobuttonCircleEmpty color={iconColor} size={24} />
        )}
        {!last ? (
          <Stack
            flex={1}
            width="$1"
            minHeight="$0.5"
            borderRadius="$1"
            backgroundColor={iconColor}
          />
        ) : null}
      </YStack>
      <YStack flex={1} paddingVertical="$3" gap="$1">
        <Typography variant="paragraph" color="$foregroundPrimary">
          {label}
        </Typography>
        {note ? (
          <Typography variant="micro" color="$foregroundSecondary">
            {note}
          </Typography>
        ) : null}
      </YStack>
      {isPressable ? <ChevronRight color={chevronColor} size={24} /> : null}
    </StepperCheckFrame>
  )
}
