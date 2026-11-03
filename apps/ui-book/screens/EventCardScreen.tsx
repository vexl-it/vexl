import {EventCard} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

const ATTENDEES = [
  {id: '1', name: 'Lea', avatarSource: vexlAvatarSource},
  {id: '2', name: 'Stepan', avatarSource: vexlAvatarSource},
  {id: '3', name: 'Grafon', avatarSource: vexlAvatarSource},
]

const MANY_ATTENDEES = [
  {id: '1', name: 'Lea', avatarSource: vexlAvatarSource},
  {id: '2', name: 'Stepan', avatarSource: vexlAvatarSource},
  {id: '3', name: 'Grafon', avatarSource: vexlAvatarSource},
  {id: '4', name: 'Alice', avatarSource: vexlAvatarSource},
  {id: '5', name: 'Bob', avatarSource: vexlAvatarSource},
]

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Upcoming">
        <EventCard
          title="Vexl Meetup ft. Bitcoin Paraguay"
          details={['Tue, Nov 2025', '19:00-23:00', 'JazzCube, Asuncion']}
          attendees={ATTENDEES}
          onPress={() => {
            Alert.alert('Pressed', 'Upcoming event')
          }}
        />
      </DemoSection>

      <DemoSection title="Past">
        <EventCard
          title="Vexl Meetup ft. Bitcoin Paraguay"
          details={['Tue, Nov 2025', '19:00-23:00', 'JazzCube, Asuncion']}
          attendees={ATTENDEES}
          state="past"
          onPress={() => {
            Alert.alert('Pressed', 'Past event')
          }}
        />
      </DemoSection>

      <DemoSection title="Long location (2 lines)">
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
      </DemoSection>

      <DemoSection title="No attendees">
        <EventCard
          title="Bitcoin Conference 2026"
          details={['Mon, Jan 2026', '10:00-18:00', 'Prague Congress Centre']}
        />
      </DemoSection>
    </>
  )
}

export function EventCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Event Card" demos={Demos} />
}
