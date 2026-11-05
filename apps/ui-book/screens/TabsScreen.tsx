import {Tabs} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const largeTwoTabs = [
  {label: 'Offers', value: 'offers'},
  {label: 'Messages', value: 'messages'},
] as const

const smallFiveTabs = [
  {label: 'All', value: 'all'},
  {label: 'Buy', value: 'buy'},
  {label: 'Sell', value: 'sell'},
  {label: 'Saved', value: 'saved'},
  {label: 'Drafts', value: 'drafts'},
] as const

const scrollableTabs = [
  {label: 'Featured', value: 'featured'},
  {label: 'Nearby', value: 'nearby'},
  {label: 'Recent', value: 'recent'},
  {label: 'Popular', value: 'popular'},
  {label: 'Trending', value: 'trending'},
  {label: 'Recommended', value: 'recommended'},
] as const

type TabValue<T extends ReadonlyArray<{readonly value: string}>> =
  T[number]['value']

function Demos(): React.JSX.Element {
  const [largeActive, setLargeActive] =
    useState<TabValue<typeof largeTwoTabs>>('offers')
  const [smallActive, setSmallActive] =
    useState<TabValue<typeof smallFiveTabs>>('all')
  const [scrollableActive, setScrollableActive] =
    useState<TabValue<typeof scrollableTabs>>('featured')

  return (
    <>
      <DemoSection title="Large (2 items)">
        <Tabs
          tabs={largeTwoTabs}
          activeTab={largeActive}
          onTabPress={setLargeActive}
          size="large"
        />
      </DemoSection>
      <DemoSection title="Small (5 items)">
        <Tabs
          tabs={smallFiveTabs}
          activeTab={smallActive}
          onTabPress={setSmallActive}
          size="small"
        />
      </DemoSection>
      <DemoSection title="Scrollable (overflow)">
        <Tabs
          tabs={scrollableTabs}
          activeTab={scrollableActive}
          onTabPress={setScrollableActive}
          size="large"
        />
      </DemoSection>
    </>
  )
}

export function TabsScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Tabs" demos={Demos} />
}
