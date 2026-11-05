import {
  Camera,
  Copy,
  ImagePhoto,
  PopoverMenu,
  PopoverMenuItem,
  Reply,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Alert, ScrollView} from 'react-native'

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const handlePress = useCallback((label: string) => {
    Alert.alert('Pressed', label)
  }, [])

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundSecondary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <PopoverMenu>
          <PopoverMenuItem
            icon={Camera}
            label="Camera"
            onPress={() => {
              handlePress('Camera')
            }}
          />
          <PopoverMenuItem
            icon={ImagePhoto}
            label="Gallery"
            onPress={() => {
              handlePress('Gallery')
            }}
          />
        </PopoverMenu>

        <PopoverMenu>
          <PopoverMenuItem
            icon={Reply}
            label="Reply"
            onPress={() => {
              handlePress('Reply')
            }}
          />
          <PopoverMenuItem
            icon={Copy}
            label="Copy"
            onPress={() => {
              handlePress('Copy')
            }}
          />
        </PopoverMenu>
      </YStack>
    </Theme>
  )
}

export function PopoverMenuScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Popover Menu
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
