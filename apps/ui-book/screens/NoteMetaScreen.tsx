import {NoteMeta, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <DemoSection title="Narrow container (280px)">
      <YStack width={280} gap="$5" backgroundColor="$backgroundTertiary">
        <NoteMeta expiration="Expires in 23 hours" />
        <NoteMeta
          commonFriends="3 common friends"
          expiration="Expires in 23 hours"
        />
        <NoteMeta
          commonFriends="3 common friends"
          trustedFriends="1 trusted"
          expiration="Expires in 7 days"
        />
        <NoteMeta
          commonFriends="12 gemeinsame Freunde"
          trustedFriends="3 vertraut"
          expiration="Läuft in 7 Tagen ab"
        />
      </YStack>
    </DemoSection>
  )
}

export function NoteMetaScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Note Meta" demos={Demos} />
}
