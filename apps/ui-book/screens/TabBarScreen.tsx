import {
  SizableText,
  TabBar,
  Theme,
  YStack,
  type TabBarItem,
} from '@vexl-next/ui'
import {ChatBubbles} from '@vexl-next/ui/src/icons/ChatBubbles'
import {Exchange} from '@vexl-next/ui/src/icons/Exchange'
import {PeopleUsers} from '@vexl-next/ui/src/icons/PeopleUsers'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

type AppTab = 'market' | 'chats' | 'community'

const tabs: ReadonlyArray<TabBarItem<AppTab>> = [
  {label: 'Market', value: 'market', icon: Exchange},
  {label: 'Chats', value: 'chats', icon: ChatBubbles, badge: true},
  {label: 'Community', value: 'community', icon: PeopleUsers},
]

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('market')

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
        overflow="hidden"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
          paddingHorizontal="$5"
          paddingTop="$5"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>
        <TabBar tabs={tabs} activeTab={activeTab} onTabPress={setActiveTab} />
      </YStack>
    </Theme>
  )
}

export function TabBarScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Tab Bar
        </SizableText>
        <ThemedColumn theme="light" />
        <ThemedColumn theme="dark" />
      </YStack>
    </ScrollView>
  )
}
