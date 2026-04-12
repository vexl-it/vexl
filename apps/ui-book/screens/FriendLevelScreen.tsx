import {
  FriendLevel,
  type FriendLevelDegree,
  Theme,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [selected, setSelected] = useState<FriendLevelDegree>('ALL')

  return (
    <Theme name={theme}>
      <YStack
        flex={1}
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </Typography>

        <YStack gap="$3">
          <Typography variant="description" color="$foregroundSecondary">
            Interactive (tap to toggle)
          </Typography>
          <XStack justifyContent="center" flexWrap="wrap" gap="$3">
            <FriendLevel
              degree="FIRST"
              selected={selected === 'FIRST'}
              title="1st degree"
              subtitle="Reach 797 vexlaks"
              onPress={() => {
                setSelected('FIRST')
              }}
            />
            <FriendLevel
              degree="ALL"
              selected={selected === 'ALL'}
              title="2nd degree"
              subtitle="Reach 1,675 vexlaks"
              onPress={() => {
                setSelected('ALL')
              }}
            />
          </XStack>
        </YStack>

        <YStack gap="$3">
          <Typography variant="description" color="$foregroundSecondary">
            Loading state
          </Typography>
          <XStack justifyContent="center" flexWrap="wrap" gap="$3">
            <FriendLevel
              degree="FIRST"
              selected={false}
              title="1st degree"
              loading
            />
            <FriendLevel degree="ALL" selected title="2nd degree" loading />
          </XStack>
        </YStack>
      </YStack>
    </Theme>
  )
}

export function FriendLevelScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          FriendLevel
        </Typography>

        <YStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </YStack>
      </YStack>
    </ScrollView>
  )
}
