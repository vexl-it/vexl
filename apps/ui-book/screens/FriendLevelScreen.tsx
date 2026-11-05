import {FriendLevel, type FriendLevelDegree, XStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [selected, setSelected] = useState<FriendLevelDegree>('ALL')

  return (
    <>
      <DemoSection title="Interactive (tap to toggle)">
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
      </DemoSection>

      <DemoSection title="Loading state">
        <XStack justifyContent="center" flexWrap="wrap" gap="$3">
          <FriendLevel
            degree="FIRST"
            selected={false}
            title="1st degree"
            loading
          />
          <FriendLevel degree="ALL" selected title="2nd degree" loading />
        </XStack>
      </DemoSection>
    </>
  )
}

export function FriendLevelScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Friend Level" demos={Demos} />
}
