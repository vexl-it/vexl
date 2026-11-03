import {MarketplaceEmptyLoader} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return <MarketplaceEmptyLoader label="Loading offers..." />
}

export function MarketplaceEmptyLoaderScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout title="Marketplace Empty Loader" demos={Demos} />
  )
}
