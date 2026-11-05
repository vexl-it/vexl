import React from 'react'
import {useTheme} from 'tamagui'
import {PinGeolocation} from '../icons/PinGeolocation'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface LocationSuggestionRowProps {
  readonly title: string
  readonly subtitle?: string
  readonly onPress: () => void
}

export function LocationSuggestionRow({
  title,
  subtitle,
  onPress,
}: LocationSuggestionRowProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <XStack
      role="button"
      alignItems="flex-start"
      gap="$4"
      paddingTop="$5"
      pressStyle={{opacity: 0.7}}
      onPress={onPress}
    >
      <Stack paddingTop="$1">
        <PinGeolocation size={24} color={theme.foregroundPrimary.get()} />
      </Stack>
      <YStack
        flex={1}
        gap="$1"
        paddingBottom="$5"
        borderBottomWidth={1}
        borderBottomColor="$backgroundTertiary"
      >
        <Typography variant="paragraphSmall" color="$foregroundPrimary">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="description" color="$foregroundSecondary">
            {subtitle}
          </Typography>
        ) : null}
      </YStack>
    </XStack>
  )
}
