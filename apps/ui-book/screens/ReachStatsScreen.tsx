import type {ReachStatsStep} from '@vexl-next/ui'
import {PeopleUsers, ReachStats} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const STEPS: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: true},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: false},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: false},
]

const STEPS_MID: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: true},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: true},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: false},
]

const STEPS_ALL: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: true},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: true},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: true},
]

const STEPS_NONE: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: false},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: false},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: false},
]

function handleButtonPress(): void {
  Alert.alert('Pressed', 'Add contacts')
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="First step active (reach)">
        <ReachStats
          subtitle="Your reach"
          headline="80 vexlaks"
          steps={STEPS}
          buttonLabel="Add contacts"
          onButtonPress={handleButtonPress}
        />
      </DemoSection>
      <DemoSection title="Two steps active">
        <ReachStats
          subtitle="Your reach"
          headline="350 vexlaks"
          steps={STEPS_MID}
          buttonLabel="Add contacts"
          onButtonPress={handleButtonPress}
        />
      </DemoSection>
      <DemoSection title="All steps active">
        <ReachStats
          subtitle="Your reach"
          headline="1200 vexlaks"
          steps={STEPS_ALL}
          buttonLabel="Add contacts"
          onButtonPress={handleButtonPress}
        />
      </DemoSection>
      <DemoSection title="No steps active (deals)">
        <ReachStats
          subtitle="Closed"
          headline="0 deals"
          steps={STEPS_NONE}
          buttonLabel="View deals"
          onButtonPress={handleButtonPress}
        />
      </DemoSection>
      <DemoSection title="No stepper">
        <ReachStats
          subtitle="Closed"
          headline="5 deals"
          steps={[]}
          buttonLabel="View deals"
          onButtonPress={handleButtonPress}
        />
      </DemoSection>
    </>
  )
}

export function ReachStatsScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Reach Stats" demos={Demos} />
}
