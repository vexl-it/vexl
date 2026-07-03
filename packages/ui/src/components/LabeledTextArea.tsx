import React from 'react'
import {styled, useTheme} from 'tamagui'

import {TextArea, YStack} from '../primitives'
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

const LabelFrame = styled(YStack, {
  name: 'LabeledTextAreaLabel',
  backgroundColor: '$backgroundTertiary',
  paddingHorizontal: '$4',
  paddingVertical: '$4',
  borderTopLeftRadius: '$5',
  borderTopRightRadius: '$5',
  borderBottomLeftRadius: '$2',
  borderBottomRightRadius: '$2',
})

const ContentFrame = styled(YStack, {
  name: 'LabeledTextAreaContent',
  backgroundColor: '$backgroundSecondary',
  padding: '$4',
  borderTopLeftRadius: '$2',
  borderTopRightRadius: '$2',
  borderBottomLeftRadius: '$5',
  borderBottomRightRadius: '$5',
})

/**
 * Multiline text input with the label rendered as a header strip above the
 * input bubble (same two-tone pattern as the Note card) and an optional
 * character counter below.
 */
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
      <YStack>
        <LabelFrame>
          <Typography
            pt="$0.5"
            variant="descriptionBold"
            color="$foregroundPrimary"
          >
            {label}
          </Typography>
        </LabelFrame>
        <ContentFrame>
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
        </ContentFrame>
      </YStack>
      {maxLength !== undefined ? (
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          alignSelf="flex-end"
        >
          {`${value.length}/${maxLength}`}
        </Typography>
      ) : null}
    </YStack>
  )
}
