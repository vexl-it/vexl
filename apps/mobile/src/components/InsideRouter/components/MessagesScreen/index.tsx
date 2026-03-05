import {Screen} from '@vexl-next/ui'
import React from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import InsideNavigationBar from '../InsideNavigationBar'
import ChatsList from './components/ChatsList'

function MessagesScreen(): React.ReactElement {
  const insets = useSafeAreaInsets()

  return (
    <Screen
      graphicHeader
      topInset={insets.top}
      navigationBar={<InsideNavigationBar />}
    >
      <ChatsList />
    </Screen>
  )
}

export default MessagesScreen
