import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {
  ArrowsHorizontal,
  ChatBubbles,
  PeopleUsers,
  TabBar as UiTabBar,
  type TabBarItem,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {areThereUnreadMessagesAtom} from '../../../state/chat/atoms/unreadChatsCountAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export const TAB_BAR_HEIGHT_PX = 72

const TABS: ReadonlyArray<
  Omit<TabBarItem<string>, 'badge' | 'label'> & {
    readonly translationKey:
      | 'tabBar.marketplace'
      | 'tabBar.messages'
      | 'tabBar.community'
  }
> = [
  {
    translationKey: 'tabBar.marketplace',
    value: 'Marketplace',
    icon: ArrowsHorizontal,
  },
  {
    translationKey: 'tabBar.messages',
    value: 'Messages',
    icon: ChatBubbles,
  },
  {
    translationKey: 'tabBar.community',
    value: 'Community',
    icon: PeopleUsers,
  },
]

function TabBar({state, navigation}: BottomTabBarProps): React.ReactElement {
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const areThereUnreadMessages = useAtomValue(areThereUnreadMessagesAtom)

  const tabs: ReadonlyArray<TabBarItem<string>> = useMemo(
    () =>
      TABS.map((tab) => ({
        label: t(tab.translationKey),
        value: tab.value,
        icon: tab.icon,
        badge: tab.value === 'Messages' && areThereUnreadMessages,
      })),
    [areThereUnreadMessages, t]
  )

  const activeTab = state.routes[state.index]?.name ?? 'Marketplace'

  return (
    <UiTabBar
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={(value) => {
        const event = navigation.emit({
          type: 'tabPress',
          target: state.routes.find((r) => r.name === value)?.key,
          canPreventDefault: true,
        })

        if (!event.defaultPrevented) {
          navigation.navigate(value)
        }
      }}
      bottomInset={insets.bottom}
    />
  )
}

export default TabBar
