import {SizableText, Tabs, Theme, YStack} from '@vexl-next/ui'
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

type ScrollableTabValue =
  | 'featured'
  | 'nearby'
  | 'recent'
  | 'popular'
  | 'trending'
  | 'recommended'

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
  const [scrollableActive, setScrollableActive] =
    useState<ScrollableTabValue>('featured')

  const handleLargePress = useCallback((value: 'offers' | 'messages') => {
    setLargeActive(value)
  }, [])

  const handleSmallPress = useCallback(
    (value: 'all' | 'buy' | 'sell' | 'saved' | 'drafts') => {
      setSmallActive(value)
    },
    []
  )

  const handleScrollablePress = useCallback((value: ScrollableTabValue) => {
    setScrollableActive(value)
  }, [])

  return (
    <Theme name={theme}>
      <YStack
        gap="$5"
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

        <SectionLabel>Scrollable (overflow)</SectionLabel>
        <Tabs
          tabs={scrollableTabs}
          activeTab={scrollableActive}
          onTabPress={handleScrollablePress}
          size="large"
        />
      </YStack>
    </Theme>
  )
}

export function TabsScreen(): React.JSX.Element {
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

        <ThemedColumn theme="light" />
        <ThemedColumn theme="dark" />
      </YStack>
    </ScrollView>
  )
}
