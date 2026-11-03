import {Switch} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [onAtom] = useState(() => atom(true))
  const [offAtom] = useState(() => atom(false))

  return (
    <>
      <DemoSection title="On">
        <Switch valueAtom={onAtom} />
      </DemoSection>
      <DemoSection title="Off">
        <Switch valueAtom={offAtom} />
      </DemoSection>
    </>
  )
}

export function SwitchScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Switch" demos={Demos} />
}
