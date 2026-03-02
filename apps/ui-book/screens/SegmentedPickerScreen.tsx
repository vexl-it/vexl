import {SegmentedPicker, SizableText, Theme, YStack} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'

const twoTabs = [
  {label: 'Buy', value: 'buy'},
  {label: 'Sell', value: 'sell'},
] as const

const threeTabs = [
  {label: 'All', value: 'all'},
  {label: 'Offers', value: 'offers'},
  {label: 'Requests', value: 'requests'},
] as const

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [twoActive, setTwoActive] = useState<'buy' | 'sell'>('buy')
  const [threeActive, setThreeActive] = useState<'all' | 'offers' | 'requests'>(
    'all'
  )

  const handleTwoPress = useCallback((value: 'buy' | 'sell') => {
    setTwoActive(value)
  }, [])

  const handleThreePress = useCallback(
    (value: 'all' | 'offers' | 'requests') => {
      setThreeActive(value)
    },
    []
  )

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SizableText
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          2 tabs
        </SizableText>
        <SegmentedPicker
          tabs={twoTabs}
          activeTab={twoActive}
          onTabPress={handleTwoPress}
        />

        <SizableText
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          3 tabs
        </SizableText>
        <SegmentedPicker
          tabs={threeTabs}
          activeTab={threeActive}
          onTabPress={handleThreePress}
        />
      </YStack>
    </Theme>
  )
}

export function SegmentedPickerScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Segmented Picker
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}
