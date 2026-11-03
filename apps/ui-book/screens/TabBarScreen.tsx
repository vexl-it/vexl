import {
  ChatBubbles,
  ExchangeIcon,
  PeopleUsers,
  TabBar,
  YStack,
  type TabBarItem,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

type AppTab = 'market' | 'chats' | 'community'

const tabs: ReadonlyArray<TabBarItem<AppTab>> = [
  {label: 'Market', value: 'market', icon: ExchangeIcon},
  {label: 'Chats', value: 'chats', icon: ChatBubbles, badge: true},
  {label: 'Community', value: 'community', icon: PeopleUsers},
]

function Demos(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('market')

  return (
    <YStack borderRadius="$4" overflow="hidden">
      <TabBar tabs={tabs} activeTab={activeTab} onTabPress={setActiveTab} />
    </YStack>
  )
}

export function TabBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Tab Bar" demos={Demos} />
}
