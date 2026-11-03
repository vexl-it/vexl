import React from 'react'
import {useTheme} from 'tamagui'

import {typographyVariantStyles} from '../config/fonts'
import {TextArea, YStack} from '../primitives'
import {LengthCounter} from './LengthCounter'
import {TwoToneCard} from './TwoToneCard'
import {Typography} from './Typography'

export const TEXT_AREA_MIN_HEIGHT = 140

export interface LabeledTextAreaProps {
  /** Without a label, the field renders as a single rounded frame. */
  readonly label?: string
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly placeholder?: string
  /** When set, a `<length>/<maxLength>` counter is shown below the field. */
  readonly maxLength?: number
  readonly minHeight?: number
  readonly autoFocus?: boolean
}

export function LabeledTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  minHeight = TEXT_AREA_MIN_HEIGHT,
  autoFocus,
}: LabeledTextAreaProps): React.JSX.Element {
  const theme = useTheme()
  const contentTopRadius = label === undefined ? '$5' : '$2'

  return (
    <YStack gap="$2">
      <TwoToneCard gap="$2">
        {label !== undefined ? (
          <TwoToneCard.Header>
            <Typography
              pt="$0.5"
              variant="descriptionBold"
              color="$foregroundPrimary"
            >
              {label}
            </Typography>
          </TwoToneCard.Header>
        ) : null}
        <TwoToneCard.Content
          borderTopLeftRadius={contentTopRadius}
          borderTopRightRadius={contentTopRadius}
        >
          <TextArea
            backgroundColor="transparent"
            borderWidth={0}
            padding="$0"
            {...typographyVariantStyles.paragraph}
            minHeight={minHeight}
            color="$foregroundPrimary"
            autoFocus={autoFocus}
            maxLength={maxLength}
            multiline
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.foregroundSecondary.get()}
            selectionColor={theme.accentYellowPrimary.get()}
            value={value}
            verticalAlign="top"
          />
        </TwoToneCard.Content>
      </TwoToneCard>
      {maxLength !== undefined ? (
        <LengthCounter length={value.length} maxLength={maxLength} />
      ) : null}
    </YStack>
  )
}
