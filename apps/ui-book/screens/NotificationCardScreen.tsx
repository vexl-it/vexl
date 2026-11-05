import {Avatar, NotificationCard, TextTag} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

function VexlAvatar(): React.JSX.Element {
  return <Avatar source={vexlAvatarSource} size="small" customSize={36} />
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Default">
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="13:02"
          category="System"
          message='From permissionless to permissioned. This week, we explore how quickly "your money" turns into theirs.'
        />
      </DemoSection>
      <DemoSection title="With New tag">
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="13:02"
          category="System"
          message='From permissionless to permissioned. This week, we explore how quickly "your money" turns into theirs.'
          tag={<TextTag variant="new" label="New" />}
        />
      </DemoSection>
      <DemoSection title="Pressable">
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="09:15"
          category="Blog"
          message="Why peer-to-peer trading matters more than ever in 2026."
          tag={<TextTag variant="new" label="New" />}
          onPress={() => {}}
        />
      </DemoSection>
      <DemoSection title="With children">
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="16:45"
          category="Update"
          message="There is a new event near you."
        >
          <TextTag variant="waiting" label="Nearby" />
        </NotificationCard>
      </DemoSection>
    </>
  )
}

export function NotificationCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Notification Card" demos={Demos} />
}
