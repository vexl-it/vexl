import React, {useMemo} from 'react'
import {styled, useTheme} from 'tamagui'

import {CheckboxFilled} from '../icons/CheckboxFilled'
import {PeopleUsers} from '../icons/PeopleUsers'
import {SizableText, Stack, XStack, YStack} from '../primitives'

const SelectClubCellFrame = styled(XStack, {
  name: 'SelectClubCellFrame',
  alignItems: 'center',
  padding: '$3',
  gap: '$3',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    selected: {
      true: {
        backgroundColor: '$accentYellowSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const IconBox = styled(Stack, {
  name: 'SelectClubCellIconBox',
  width: '$9',
  height: '$9',
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
})

const NameText = styled(SizableText, {
  name: 'SelectClubCellName',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',
  color: '$foregroundPrimary',

  variants: {
    selected: {
      true: {
        color: '$accentHighlightSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const DescriptionText = styled(SizableText, {
  name: 'SelectClubCellDescription',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$foregroundSecondary',
})

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

  const checkboxColor = useMemo(
    () => theme.accentHighlightSecondary.val,
    [theme.accentHighlightSecondary.val]
  )

  const iconBoxBg = useMemo(
    () => theme.accentYellowSecondary.val,
    [theme.accentYellowSecondary.val]
  )

  const descriptionIconColor = useMemo(
    () => theme.foregroundSecondary.val,
    [theme.foregroundSecondary.val]
  )

  return (
    <SelectClubCellFrame selected={selected} onPress={onPress}>
      {selected ? (
        <IconBox backgroundColor={iconBoxBg}>
          <CheckboxFilled size={24} color={checkboxColor} />
        </IconBox>
      ) : (
        <>{avatar}</>
      )}
      <YStack flex={1} justifyContent="center" gap="$1">
        <NameText selected={selected}>{name}</NameText>
        <XStack alignItems="center" gap="$1">
          <PeopleUsers size={16} color={descriptionIconColor} />
          <DescriptionText>{description}</DescriptionText>
        </XStack>
      </YStack>
    </SelectClubCellFrame>
  )
}
