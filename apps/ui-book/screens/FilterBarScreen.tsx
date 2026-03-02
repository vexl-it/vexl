import {FilterBar, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'

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

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
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

  const handleAllChange = useCallback((values: ReadonlySet<string>) => {
    setAllSelected(values)
  }, [])

  return (
    <Theme name={theme}>
      <YStack
        gap="$5"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
        flex={1}
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>Few items (3)</SectionLabel>
        <FilterBar
          items={fewItems}
          selectedValues={fewSelected}
          onSelectedValuesChange={handleFewChange}
        />

        <SectionLabel>None selected</SectionLabel>
        <FilterBar
          items={fewItems}
          selectedValues={noneSelected}
          onSelectedValuesChange={handleNoneChange}
        />

        <SectionLabel>All selected</SectionLabel>
        <FilterBar
          items={manyItems}
          selectedValues={allSelected}
          onSelectedValuesChange={handleAllChange}
        />
      </YStack>
    </Theme>
  )
}

export function FilterBarScreen(): React.JSX.Element {
  const [scrollableSelected, setScrollableSelected] = useState<
    ReadonlySet<string>
  >(new Set(['buy-btc', 'sell-btc']))

  const handleScrollableChange = useCallback((values: ReadonlySet<string>) => {
    setScrollableSelected(values)
  }, [])

  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Filter Bar
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>

        <SectionLabel>Scrollable (overflow)</SectionLabel>
        <FilterBar
          items={manyItems}
          selectedValues={scrollableSelected}
          onSelectedValuesChange={handleScrollableChange}
        />
      </YStack>
    </ScrollView>
  )
}
