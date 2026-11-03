import {Avatar, SelectClubCell, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const clubTestAvatar = require('../assets/clubTestAvatar.png') as number

const clubAvatar = <Avatar customSize={40} source={clubTestAvatar} />

const clubs = [
  {key: 'prague', name: 'Bitcoin Prague', description: '10 members'},
  {key: 'vienna', name: 'Bitcoin Vienna', description: '25 members'},
  {key: 'berlin', name: 'Bitcoin Berlin', description: '8 members'},
]

function Demos(): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    new Set(['vienna'])
  )

  const toggle = (key: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <DemoSection title="Multi-select list">
      <YStack gap="$3">
        {clubs.map((club) => (
          <SelectClubCell
            key={club.key}
            selected={selected.has(club.key)}
            name={club.name}
            description={club.description}
            avatar={clubAvatar}
            onPress={() => {
              toggle(club.key)
            }}
          />
        ))}
      </YStack>
    </DemoSection>
  )
}

export function SelectClubCellScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Select Club Cell" demos={Demos} />
}
