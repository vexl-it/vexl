import {PriceRangeInput} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useState} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function handleCurrencyPress(): void {
  Alert.alert('Currency', 'Navigate to currency selection screen')
}

function PriceRangeInputDemo({
  maxLabel,
}: {
  readonly maxLabel?: string
}): React.JSX.Element {
  const [minValueAtom] = useState(() => atom(800))
  const [maxValueAtom] = useState(() => atom(15000))

  return (
    <PriceRangeInput
      minValueAtom={minValueAtom}
      maxValueAtom={maxValueAtom}
      currency="EUR"
      onCurrencyPress={handleCurrencyPress}
      maxLimit={15000}
      maxLabel={maxLabel}
    />
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Default">
        <PriceRangeInputDemo />
      </DemoSection>
      <DemoSection title='With "Max" label at cap'>
        <PriceRangeInputDemo maxLabel="Max" />
      </DemoSection>
    </>
  )
}

export function PriceRangeInputScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Price Range Input" demos={Demos} />
}
