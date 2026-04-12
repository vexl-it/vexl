import {Typography} from '@vexl-next/ui'
import {TrashBin} from '@vexl-next/ui/src/icons'
import {XStack} from '@vexl-next/ui/src/primitives'
import React from 'react'
import {useTheme} from 'tamagui'

function LocationRow({
  text,
  onRemove,
}: {
  readonly text: string
  readonly onRemove: () => void
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      height="$11"
      pl="$5"
      pr="$3"
      py="$5"
      alignItems="center"
    >
      <Typography
        variant="description"
        color="$foregroundPrimary"
        flex={1}
        numberOfLines={1}
      >
        {text}
      </Typography>
      <XStack
        onPress={onRemove}
        pressStyle={{opacity: 0.7}}
        alignItems="center"
        justifyContent="center"
        pr="$1"
      >
        <TrashBin size={24} color={theme.foregroundPrimary.val} />
      </XStack>
    </XStack>
  )
}

export default LocationRow
