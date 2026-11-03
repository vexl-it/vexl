import {
  BellNotification,
  Calendar,
  CurrencyBitcoinCircle,
  PinGeolocation,
  RowButton,
  TrashBin,
  UserProfile,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const toggleRows = [
  {value: 'profile', label: 'Profile', icon: UserProfile},
  {value: 'notif', label: 'Notifications', icon: BellNotification},
  {value: 'btc', label: 'Bitcoin', icon: CurrencyBitcoinCircle},
] as const

function Demos(): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [hasDate, setHasDate] = useState(true)
  const [locations, setLocations] = useState<readonly string[]>([
    'Prague 7, radius 2 km',
    'Holešovice 238/8, Prague 7, Czech Republic - radius 10 km',
  ])

  const toggle = (key: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <>
      <DemoSection title="Tap to toggle">
        {pipe(
          toggleRows,
          Array.map((row) => (
            <RowButton
              key={row.value}
              label={row.label}
              icon={row.icon}
              value={row.value}
              selected={selected.has(row.value)}
              onPress={toggle}
            />
          ))
        )}
      </DemoSection>
      <DemoSection title="Red variant">
        <RowButton
          label="Delete"
          icon={TrashBin}
          variant="red"
          onPress={() => {}}
        />
      </DemoSection>
      <DemoSection title="Trailing action">
        <RowButton
          label={hasDate ? 'Friday, 23 July 2027' : 'Select date'}
          icon={Calendar}
          onPress={() => {
            setHasDate(true)
          }}
          trailingAction={
            hasDate
              ? {
                  icon: XmarkCancelClose,
                  accessibilityLabel: 'Clear',
                  onPress: () => {
                    setHasDate(false)
                  },
                }
              : undefined
          }
        />
        {pipe(
          locations,
          Array.map((location) => (
            <RowButton
              key={location}
              label={location}
              icon={PinGeolocation}
              trailingAction={{
                icon: TrashBin,
                accessibilityLabel: 'Remove',
                onPress: () => {
                  setLocations(Array.filter((l) => l !== location))
                },
              }}
            />
          ))
        )}
      </DemoSection>
    </>
  )
}

export function RowButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Row Button" demos={Demos} />
}
