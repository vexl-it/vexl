import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {CheckboxFilled} from '../icons/CheckboxFilled'
import {PeopleUsers} from '../icons/PeopleUsers'
import {XStack, YStack} from '../primitives'
import {IconBox} from './IconBox'
import {SelectionRowFrame} from './SelectionRow'
import {Typography} from './Typography'

export interface SelectClubCellProps {
  readonly selected?: boolean
  readonly name: string
  readonly avatar: React.ReactNode
  readonly description: string
  readonly onPress?: () => void
}

export function SelectClubCell({
  selected = false,
  name,
  avatar,
  description,
  onPress,
}: SelectClubCellProps): React.JSX.Element {
  const theme = useTheme()
  const sizes = getTokens().size

  return (
    <SelectionRowFrame selected={selected} padding="$3" onPress={onPress}>
      {selected ? (
        <IconBox tone="accent">
          <CheckboxFilled
            size={sizes.$7.val}
            color={theme.accentHighlightSecondary.get()}
          />
        </IconBox>
      ) : (
        avatar
      )}
      <YStack flex={1} justifyContent="center" gap="$1">
        <Typography
          variant="descriptionBold"
          color={selected ? '$accentHighlightSecondary' : '$foregroundPrimary'}
        >
          {name}
        </Typography>
        <XStack alignItems="center" gap="$1">
          <PeopleUsers
            size={sizes.$5.val}
            color={theme.foregroundSecondary.get()}
          />
          <Typography variant="micro" color="$foregroundSecondary">
            {description}
          </Typography>
        </XStack>
      </YStack>
    </SelectionRowFrame>
  )
}
