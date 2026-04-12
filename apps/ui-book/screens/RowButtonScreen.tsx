import {
  BellNotification,
  CurrencyBitcoinCircle,
  HomeHomemade,
  Lock,
  PinGeolocation,
  RowButton,
  SizableText,
  Theme,
  UserProfile,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function InteractiveGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const toggle = (key: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
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

        <SectionLabel>Tap to toggle</SectionLabel>
        <YStack gap="$3">
          <RowButton
            label="Home"
            icon={HomeHomemade}
            value="home"
            selected={selected.has('home')}
            onPress={toggle}
          />
          <RowButton
            label="Profile"
            icon={UserProfile}
            value="profile"
            selected={selected.has('profile')}
            onPress={toggle}
          />
          <RowButton
            label="Notifications"
            icon={BellNotification}
            value="notif"
            selected={selected.has('notif')}
            onPress={toggle}
          />
          <RowButton
            label="Bitcoin"
            icon={CurrencyBitcoinCircle}
            value="btc"
            selected={selected.has('btc')}
            onPress={toggle}
          />
          <RowButton
            label="Location"
            icon={PinGeolocation}
            value="loc"
            selected={selected.has('loc')}
            onPress={toggle}
          />
          <RowButton
            label="Security"
            icon={Lock}
            value="lock"
            selected={selected.has('lock')}
            onPress={toggle}
          />
        </YStack>
      </YStack>
    </Theme>
  )
}

export function RowButtonScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Row Button
        </SizableText>

        <InteractiveGroup theme="light" />
        <InteractiveGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
