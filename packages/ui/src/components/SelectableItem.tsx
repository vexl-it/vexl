import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {RadiobuttonCircleFilled} from '../icons'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const SelectableItemFrame = styled(XStack, {
  name: 'SelectableItem',
  alignItems: 'center',
  gap: '$3',
  paddingVertical: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.6,
  },
})

type SelectableItemFrameProps = React.ComponentProps<typeof SelectableItemFrame>

export interface SelectableItemProps extends Omit<
  SelectableItemFrameProps,
  'children'
> {
  readonly label: string
  readonly note?: string
  readonly emoji?: string
  readonly prefix?: string
  readonly selected?: boolean
  readonly onPress?: () => void
}

export function SelectableItem({
  label,
  note,
  emoji,
  prefix,
  selected = false,
  onPress,
  ...rest
}: SelectableItemProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <SelectableItemFrame onPress={onPress} {...rest}>
      {emoji != null ? (
        <Typography variant="heading3" color="$foregroundPrimary">
          {emoji}
        </Typography>
      ) : null}
      {prefix != null ? (
        <Typography
          variant="paragraphSmall"
          color="$foregroundSecondary"
          minWidth="$11"
        >
          {prefix}
        </Typography>
      ) : null}
      <YStack flex={1} gap="$2">
        <Typography
          variant={selected ? 'paragraphDemibold' : 'paragraph'}
          color={
            selected ? '$accentHighlightSecondary' : '$foregroundSecondary'
          }
        >
          {label}
        </Typography>
        {note != null ? (
          <Typography variant="micro" color="$foregroundTertiary">
            {note}
          </Typography>
        ) : null}
      </YStack>
      {selected ? (
        <RadiobuttonCircleFilled
          color={theme.accentHighlightSecondary.get()}
          size={getTokens().size.$7.val}
        />
      ) : null}
    </SelectableItemFrame>
  )
}
