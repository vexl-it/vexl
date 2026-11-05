import {
  avatarsGoldenGlassesAndBackgroundSvg,
  avatarsSvg,
  CurrencyBitcoinCircle,
  EditRow,
  Language,
  MegaphoneNotifications,
  MoneyBankNotes,
  PeopleUsers,
  PinGeolocation,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const testAvatar = require('../assets/testAvatar.png') as number

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const BasicAvatar = avatarsSvg[0]!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const GoldenAvatar = avatarsGoldenGlassesAndBackgroundSvg[0]!

function Demos(): React.JSX.Element {
  const handlePress = useCallback((label: string) => {
    Alert.alert('Pressed', label)
  }, [])

  return (
    <>
      <DemoSection title="Initial">
        <YStack gap="$3">
          <EditRow
            state="initial"
            headline="What are you looking for?"
            onPress={() => {
              handlePress('What are you looking for?')
            }}
          />
          <EditRow
            state="initial"
            headline="Set location"
            onPress={() => {
              handlePress('Set location')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Initial + Optional">
        <YStack gap="$3">
          <EditRow
            state="initial"
            headline="Price up to"
            optionalLabel="Optional"
            onPress={() => {
              handlePress('Price up to')
            }}
          />
          <EditRow
            state="initial"
            headline="Offer description"
            optionalLabel="Optional"
            onPress={() => {
              handlePress('Offer description')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Editing (with custom icons)">
        <YStack gap="$3">
          <EditRow
            state="editing"
            overline="Amount"
            headline="800 – 3000 USD"
            icon={CurrencyBitcoinCircle}
            onPress={() => {
              handlePress('Amount')
            }}
          />
          <EditRow
            state="editing"
            overline="Location"
            headline="Vinohradská 123/34 CZ, range 10 km"
            icon={PinGeolocation}
            onPress={() => {
              handlePress('Location')
            }}
          />
          <EditRow
            state="editing"
            overline="Payment details"
            headline="Cash, On-chain"
            icon={MoneyBankNotes}
            onPress={() => {
              handlePress('Payment details')
            }}
          />
          <EditRow
            state="editing"
            overline="Offer language"
            headline="English, Czech"
            icon={Language}
            onPress={() => {
              handlePress('Offer language')
            }}
          />
          <EditRow
            state="editing"
            overline="Who can see your offer"
            headline="2nd degree (reach 167 vexlaks)"
            icon={PeopleUsers}
            onPress={() => {
              handlePress('Who can see your offer')
            }}
          />
          <EditRow
            state="editing"
            overline="Publish to Vexl Club"
            headline="None"
            icon={MegaphoneNotifications}
            onPress={() => {
              handlePress('Publish to Vexl Club')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Headline Truncation (max 2 lines)">
        <YStack gap="$3">
          <EditRow
            state="editing"
            overline="Location"
            headline="Vinohradská 123/34, Praha 2, Czech Republic, range 10 km, Europe, Central timezone"
            icon={PinGeolocation}
            onPress={() => {
              handlePress('Truncated headline')
            }}
          />
          <EditRow
            state="completed"
            overline="Description"
            headline="This is a very long headline that should be truncated after two lines because it contains way too much text to fit"
            onPress={() => {
              handlePress('Truncated completed')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Completed">
        <YStack gap="$3">
          <EditRow
            state="completed"
            overline="Set location"
            headline="Vinohradská 123/34 CZ, range 10 km"
            onPress={() => {
              handlePress('Set location completed')
            }}
          />
          <EditRow
            state="completed"
            overline="Amount"
            headline="800 – 3000 USD"
            onPress={() => {
              handlePress('Amount completed')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Profile (with image)">
        <YStack gap="$3">
          <EditRow
            state="profile"
            overline="Contact"
            headline="John Doe"
            avatar={{source: testAvatar}}
            onPress={() => {
              handlePress('Profile image')
            }}
          />
          <EditRow
            state="profile"
            overline="Contact"
            headline="Jane Smith"
            avatar={{source: testAvatar, grayscale: true}}
            onPress={() => {
              handlePress('Profile image grayscale')
            }}
          />
        </YStack>
      </DemoSection>

      <DemoSection title="Profile, trusted">
        <EditRow
          state="profile"
          overline="Contact"
          headline="Jana Nováková"
          avatar={{source: testAvatar, trusted: true}}
        />
      </DemoSection>

      <DemoSection title="Profile (with SVG avatar)">
        <YStack gap="$3">
          <EditRow
            state="profile"
            overline="Contact"
            headline="Anonymous User"
            avatar={{children: <BasicAvatar size={40} />}}
            onPress={() => {
              handlePress('Profile SVG avatar')
            }}
          />
          <EditRow
            state="profile"
            overline="Contact"
            headline="Golden Anonymous"
            avatar={{children: <GoldenAvatar size={40} />}}
            onPress={() => {
              handlePress('Profile golden avatar')
            }}
          />
          <EditRow
            state="profile"
            overline="Contact"
            headline="Grayscale Anonymous"
            avatar={{children: <BasicAvatar size={40} grayscale />}}
            onPress={() => {
              handlePress('Profile SVG grayscale')
            }}
          />
        </YStack>
      </DemoSection>
    </>
  )
}

export function EditRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Edit Row" demos={Demos} />
}
