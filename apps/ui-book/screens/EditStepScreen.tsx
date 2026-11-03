import {
  Button,
  EditStep,
  FilterTag,
  MoneyBankNotes,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array} from 'effect'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const LANGUAGES = ['English', 'Czech', 'German']

function Demos(): React.JSX.Element {
  const [active, setActive] = useState(true)
  const [selected, setSelected] = useState<readonly string[]>(['English'])

  return (
    <YStack gap="$5">
      <EditStep
        active={active}
        title="Choose offer language"
        value={selected.join(', ')}
        onEdit={() => {
          setActive(true)
        }}
      >
        <XStack flexWrap="wrap" gap="$3">
          {LANGUAGES.map((language) => (
            <FilterTag
              key={language}
              label={language}
              selected={selected.includes(language)}
              onPress={() => {
                setSelected((prev) =>
                  prev.includes(language)
                    ? Array.filter(prev, (one) => one !== language)
                    : Array.append(prev, language)
                )
              }}
            />
          ))}
        </XStack>
        <Button
          variant="primary"
          size="large"
          onPress={() => {
            setActive(false)
          }}
        >
          Next
        </Button>
      </EditStep>
      <EditStep
        active={false}
        title="Select amount"
        overline="Amount"
        icon={MoneyBankNotes}
        value="800 – 3000 USD"
        details="Fee 2 %"
      />
      <EditStep
        active={false}
        title="Set location"
        value={'Vinohradská 123/34, range 10 km\nKarlovo náměstí, range 5 km'}
        valueSuffix="+1"
      />
      <EditStep
        active={false}
        title="Product category"
        value="Category required"
        invalid
      />
    </YStack>
  )
}

export function EditStepScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Edit Step" demos={Demos} />
}
