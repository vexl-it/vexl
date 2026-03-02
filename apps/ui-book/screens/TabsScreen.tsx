import {SizableText, Tabs, Theme, XStack, YStack} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'

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
  const [largeActive, setLargeActive] = useState<'offers' | 'messages'>(
    'offers'
  )
  const [smallActive, setSmallActive] = useState<
    'all' | 'buy' | 'sell' | 'saved' | 'drafts'
  >('all')

  const handleLargePress = useCallback((value: 'offers' | 'messages') => {
    setLargeActive(value)
  }, [])

  const handleSmallPress = useCallback(
    (value: 'all' | 'buy' | 'sell' | 'saved' | 'drafts') => {
      setSmallActive(value)
    },
    []
  )

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

        <SectionLabel>Large (2 items)</SectionLabel>
        <Tabs
          tabs={largeTwoTabs}
          activeTab={largeActive}
          onTabPress={handleLargePress}
          size="large"
        />

        <SectionLabel>Small (5 items)</SectionLabel>
        <Tabs
          tabs={smallFiveTabs}
          activeTab={smallActive}
          onTabPress={handleSmallPress}
          size="small"
        />
      </YStack>
    </Theme>
  )
}

export function TabsScreen(): React.JSX.Element {
  const [scrollableActive, setScrollableActive] = useState<
    'featured' | 'nearby' | 'recent' | 'popular' | 'trending' | 'recommended'
  >('featured')

  const handleScrollablePress = useCallback(
    (
      value:
        | 'featured'
        | 'nearby'
        | 'recent'
        | 'popular'
        | 'trending'
        | 'recommended'
    ) => {
      setScrollableActive(value)
    },
    []
  )

  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Tabs
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>

        <SectionLabel>Scrollable (overflow)</SectionLabel>
        <Tabs
          tabs={scrollableTabs}
          activeTab={scrollableActive}
          onTabPress={handleScrollablePress}
          size="large"
        />
      </YStack>
    </ScrollView>
  )
}
