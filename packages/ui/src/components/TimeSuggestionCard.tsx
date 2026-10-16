import React from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, useTheme} from 'tamagui'

import {RadiobuttonCircleEmpty} from '../icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface TimeSuggestionCardProps {
  /** E.g. "14:30". */
  readonly label: string
  readonly selected?: boolean
  /** Dims the card and disables presses. */
  readonly outdated?: boolean
  readonly onPress: () => void
}

export function TimeSuggestionCard({
  label,
  selected,
  outdated,
  onPress,
}: TimeSuggestionCardProps): React.JSX.Element {
  const theme = useTheme()
  const iconSize = getTokens().size.$7.val
  const itemColor = outdated
    ? theme.foregroundTertiary.get()
    : selected
      ? theme.accentHighlightPrimary.get()
      : theme.foregroundPrimary.get()

  return (
    <TouchableOpacity
      disabled={outdated}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <XStack
        alignItems="center"
        gap="$4"
        backgroundColor={
          selected
            ? theme.accentYellowSecondary.get()
            : theme.backgroundSecondary.get()
        }
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$5"
        opacity={outdated ? 0.5 : 1}
      >
        {selected ? (
          <RadiobuttonCircleFilled color={itemColor} size={iconSize} />
        ) : (
          <RadiobuttonCircleEmpty color={itemColor} size={iconSize} />
        )}
        <Typography variant="paragraph" color={itemColor}>
          {label}
        </Typography>
      </XStack>
    </TouchableOpacity>
  )
}
