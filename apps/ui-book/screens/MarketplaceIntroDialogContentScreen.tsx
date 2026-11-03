import {MarketplaceIntroDialogContent} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <MarketplaceIntroDialogContent description="Browse private peer-to-peer offers from people connected to your social network." />
  )
}

export function MarketplaceIntroDialogContentScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout
      title="Marketplace Intro Dialog Content"
      demos={Demos}
    />
  )
}
