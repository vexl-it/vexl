import {FilterBar} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const fewItems = [
  {label: 'Buy BTC', value: 'buy-btc'},
  {label: 'Sell BTC', value: 'sell-btc'},
  {label: 'Buy product', value: 'buy-product'},
] as const

const manyItems = [
  {label: 'Buy BTC', value: 'buy-btc'},
  {label: 'Sell BTC', value: 'sell-btc'},
  {label: 'Buy product', value: 'buy-product'},
  {label: 'Sell product', value: 'sell-product'},
  {label: 'Offer service', value: 'offer-service'},
  {label: 'Request service', value: 'request-service'},
] as const

function Demos(): React.JSX.Element {
  const [fewSelected, setFewSelected] = useState<ReadonlySet<string>>(
    new Set(['buy-btc'])
  )
  const [noneSelected, setNoneSelected] = useState<ReadonlySet<string>>(
    new Set()
  )
  const [allSelected, setAllSelected] = useState<ReadonlySet<string>>(
    new Set([
      'buy-btc',
      'sell-btc',
      'buy-product',
      'sell-product',
      'offer-service',
      'request-service',
    ])
  )

  const handleFewChange = useCallback((values: ReadonlySet<string>) => {
    setFewSelected(values)
  }, [])

  const handleNoneChange = useCallback((values: ReadonlySet<string>) => {
    setNoneSelected(values)
  }, [])

  const [scrollableSelected, setScrollableSelected] = useState<
    ReadonlySet<string>
  >(new Set(['buy-btc', 'sell-btc']))

  const handleAllChange = useCallback((values: ReadonlySet<string>) => {
    setAllSelected(values)
  }, [])

  const handleScrollableChange = useCallback((values: ReadonlySet<string>) => {
    setScrollableSelected(values)
  }, [])

  return (
    <>
      <DemoSection title="Few items (3)">
        <FilterBar
          items={fewItems}
          selectedValues={fewSelected}
          onSelectedValuesChange={handleFewChange}
        />
      </DemoSection>

      <DemoSection title="None selected">
        <FilterBar
          items={fewItems}
          selectedValues={noneSelected}
          onSelectedValuesChange={handleNoneChange}
        />
      </DemoSection>

      <DemoSection title="All selected">
        <FilterBar
          items={manyItems}
          selectedValues={allSelected}
          onSelectedValuesChange={handleAllChange}
        />
      </DemoSection>

      <DemoSection title="Scrollable">
        <FilterBar
          items={manyItems}
          selectedValues={scrollableSelected}
          onSelectedValuesChange={handleScrollableChange}
        />
      </DemoSection>
    </>
  )
}

export function FilterBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Filter Bar" demos={Demos} />
}
