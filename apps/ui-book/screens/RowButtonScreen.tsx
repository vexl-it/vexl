import {
  BellNotification,
  Calendar,
  CurrencyBitcoinCircle,
  PinGeolocation,
  RowButton,
  TrashBin,
  Typography,
  UserProfile,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const toggleRows = [
  {value: 'profile', label: 'Profile', icon: UserProfile},
  {value: 'notif', label: 'Notifications', icon: BellNotification},
  {value: 'btc', label: 'Bitcoin', icon: CurrencyBitcoinCircle},
] as const

function Label({children}: {readonly children: string}): React.JSX.Element {
  return (
    <Typography variant="descriptionBold" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

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
    <YStack gap="$3">
      <Label>Tap to toggle</Label>
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

      <Label>Red variant</Label>
      <RowButton
        label="Delete"
        icon={TrashBin}
        variant="red"
        onPress={() => {}}
      />

      <Label>Trailing action</Label>
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
    </YStack>
  )
}

export function RowButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Row Button" demos={Demos} />
}
