import React from 'react'
import {styled, useTheme} from 'tamagui'

import {ChevronRight} from '../icons/ChevronRight'
import {RadiobuttonCircleEmpty} from '../icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {SizableText, Stack, XStack, YStack} from '../primitives'

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

const LabelText = styled(SizableText, {
  name: 'StepperCheckLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  lineHeight: '$4',
  color: '$foregroundPrimary',
})

const NoteText = styled(SizableText, {
  name: 'StepperCheckNote',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  lineHeight: '$1',
  color: '$foregroundSecondary',
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
    ? theme.accentHighlightSecondary.val
    : theme.foregroundTertiary.val

  const chevronColor = theme.foregroundTertiary.val

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
        <LabelText>{label}</LabelText>
        {note ? <NoteText>{note}</NoteText> : null}
      </YStack>
      {isPressable ? <ChevronRight color={chevronColor} size={24} /> : null}
    </StepperCheckFrame>
  )
}
