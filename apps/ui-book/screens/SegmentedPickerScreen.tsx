import {SegmentedPicker} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const twoTabs = [
  {label: 'Buy', value: 'buy'},
  {label: 'Sell', value: 'sell'},
] as const

const threeTabs = [
  {label: 'All', value: 'all'},
  {label: 'Offers', value: 'offers'},
  {label: 'Requests', value: 'requests'},
] as const

function Demos(): React.JSX.Element {
  const [twoActive, setTwoActive] = useState<'buy' | 'sell'>('buy')
  const [threeActive, setThreeActive] = useState<'all' | 'offers' | 'requests'>(
    'all'
  )

  return (
    <>
      <DemoSection title="2 tabs">
        <SegmentedPicker
          tabs={twoTabs}
          activeTab={twoActive}
          onTabPress={setTwoActive}
        />
      </DemoSection>
      <DemoSection title="3 tabs">
        <SegmentedPicker
          tabs={threeTabs}
          activeTab={threeActive}
          onTabPress={setThreeActive}
        />
      </DemoSection>
    </>
  )
}

export function SegmentedPickerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Segmented Picker" demos={Demos} />
}
