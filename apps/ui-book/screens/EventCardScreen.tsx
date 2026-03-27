import {Avatar, EventCard, SizableText, Theme, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert, ScrollView} from 'react-native'

const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

function AttendeeAvatar(): React.JSX.Element {
  return <Avatar source={vexlAvatarSource} size="small" customSize={16} />
}

const ATTENDEES = [
  {id: '1', name: 'Lea', avatar: <AttendeeAvatar />},
  {id: '2', name: 'Stepan', avatar: <AttendeeAvatar />},
  {id: '3', name: 'Grafon', avatar: <AttendeeAvatar />},
]

const MANY_ATTENDEES = [
  {id: '1', name: 'Lea', avatar: <AttendeeAvatar />},
  {id: '2', name: 'Stepan', avatar: <AttendeeAvatar />},
  {id: '3', name: 'Grafon', avatar: <AttendeeAvatar />},
  {id: '4', name: 'Alice', avatar: <AttendeeAvatar />},
  {id: '5', name: 'Bob', avatar: <AttendeeAvatar />},
]

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
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

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Upcoming
        </SizableText>
        <EventCard
          title="Vexl Meetup ft. Bitcoin Paraguay"
          details={['Tue, Nov 2025', '19:00-23:00', 'JazzCube, Asuncion']}
          attendees={ATTENDEES}
          onPress={() => {
            Alert.alert('Pressed', 'Upcoming event')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Past
        </SizableText>
        <EventCard
          title="Vexl Meetup ft. Bitcoin Paraguay"
          details={['Tue, Nov 2025', '19:00-23:00', 'JazzCube, Asuncion']}
          attendees={ATTENDEES}
          state="past"
          onPress={() => {
            Alert.alert('Pressed', 'Past event')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Long location (2 lines)
        </SizableText>
        <EventCard
          title="Vexl Meetup ft. Bitcoin Paraguay"
          details={[
            'Tue, Nov 2025',
            '19:00-23:00',
            'JazzCube, Ciudad del Este, Alto Parana, Paraguay',
          ]}
          attendees={MANY_ATTENDEES}
          onPress={() => {
            Alert.alert('Pressed', 'Long location')
          }}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          No attendees
        </SizableText>
        <EventCard
          title="Bitcoin Conference 2026"
          details={['Mon, Jan 2026', '10:00-18:00', 'Prague Congress Centre']}
        />
      </YStack>
    </Theme>
  )
}

export function EventCardScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Event Card
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
