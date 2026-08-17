import React from 'react'
import {useTheme} from 'tamagui'

import {TextArea, YStack} from '../primitives'
import {LengthCounter} from './LengthCounter'
import {TwoToneContentFrame, TwoToneHeaderFrame} from './TwoToneCardFrames'
import {Typography} from './Typography'

export interface LabeledTextAreaProps {
  readonly label: string
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly placeholder?: string
  /** When set, a `<length>/<maxLength>` counter is shown below the field. */
  readonly maxLength?: number
  readonly minHeight?: number
}

export function LabeledTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  minHeight = 140,
}: LabeledTextAreaProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack gap="$2">
      <TwoToneHeaderFrame>
        <Typography
          pt="$0.5"
          variant="descriptionBold"
          color="$foregroundPrimary"
        >
          {label}
        </Typography>
      </TwoToneHeaderFrame>
      <TwoToneContentFrame>
        <TextArea
          backgroundColor="transparent"
          borderWidth={0}
          padding="$0"
          minHeight={minHeight}
          color="$foregroundPrimary"
          fontFamily="$body"
          fontSize="$3"
          lineHeight={24}
          maxLength={maxLength}
          multiline
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.foregroundSecondary.get()}
          value={value}
          verticalAlign="top"
        />
      </TwoToneContentFrame>
      {maxLength !== undefined ? (
        <LengthCounter length={value.length} maxLength={maxLength} />
      ) : null}
    </YStack>
  )
}
