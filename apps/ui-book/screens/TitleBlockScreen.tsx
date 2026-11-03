import {Divider, TitleBlock, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const title = 'Trade with friends'
const text =
  'Vexl connects you with people from your contacts so you can trade bitcoin peer to peer.'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <TitleBlock title={title} text={text} />
      <Divider />
      <TitleBlock size="large" title={title} text={text} />
      <Divider />
      <TitleBlock align="center" title={title} text={text} />
      <Divider />
      <TitleBlock align="center" size="large" title={title} text={text} />
      <Divider />
      <TitleBlock title="Title only" />
      <Divider />
      <TitleBlock text="Text only. No title is rendered above this paragraph." />
    </YStack>
  )
}

export function TitleBlockScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Title Block" demos={Demos} />
}
