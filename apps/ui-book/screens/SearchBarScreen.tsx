import {NavButton, SearchBar, TuneSettings, XStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [emptyAtom] = useState(() => atom(''))
  const [prefilledAtom] = useState(() => atom('Bitcoin'))

  return (
    <>
      <DemoSection title="Empty">
        <SearchBar valueAtom={emptyAtom} />
      </DemoSection>
      <DemoSection title="With text (X button visible)">
        <SearchBar valueAtom={prefilledAtom} />
      </DemoSection>
      <DemoSection title="With a filter button (marketplace)">
        <XStack gap="$3">
          <SearchBar valueAtom={prefilledAtom} flex={1} />
          <NavButton
            variant="secondary"
            size="large"
            icon={TuneSettings}
            badge
            onPress={() => {}}
          />
        </XStack>
      </DemoSection>
    </>
  )
}

export function SearchBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Search Bar" demos={Demos} />
}
