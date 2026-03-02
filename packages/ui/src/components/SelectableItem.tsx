import React from 'react'
import {styled, useTheme} from 'tamagui'

import {RadiobuttonCircleFilled} from '../icons'
import {SizableText, XStack, YStack} from '../primitives'

const SelectableItemFrame = styled(XStack, {
  name: 'SelectableItem',
  alignItems: 'center',
  paddingVertical: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.6,
  },
})

const SelectableItemLabel = styled(SizableText, {
  name: 'SelectableItemLabel',
  fontFamily: '$body',
  fontSize: '$4',
  letterSpacing: '$4',

  variants: {
    selected: {
      true: {
        color: '$accentHighlightSecondary',
        fontWeight: '600',
      },
      false: {
        color: '$foregroundSecondary',
        fontWeight: '500',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const SelectableItemNote = styled(SizableText, {
  name: 'SelectableItemNote',
  fontFamily: '$body',
  fontSize: '$1',
  letterSpacing: '$1',
  fontWeight: '500',
  color: '$foregroundTertiary',
})

type SelectableItemFrameProps = React.ComponentProps<typeof SelectableItemFrame>

export interface SelectableItemProps
  extends Omit<SelectableItemFrameProps, 'children'> {
  readonly label: string
  readonly note?: string
  readonly selected?: boolean
  readonly onPress?: () => void
}

export function SelectableItem({
  label,
  note,
  selected = false,
  onPress,
  ...rest
}: SelectableItemProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <SelectableItemFrame onPress={onPress} {...rest}>
      <YStack flex={1} gap="$2">
        <SelectableItemLabel selected={selected}>{label}</SelectableItemLabel>
        {note != null ? <SelectableItemNote>{note}</SelectableItemNote> : null}
      </YStack>
      {selected ? (
        <RadiobuttonCircleFilled
          color={theme.accentHighlightSecondary.val}
          size={24}
        />
      ) : null}
    </SelectableItemFrame>
  )
}
