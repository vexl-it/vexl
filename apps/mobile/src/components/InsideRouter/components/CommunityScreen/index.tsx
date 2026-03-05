import {Screen} from '@vexl-next/ui'
import React from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import InsideNavigationBar from '../InsideNavigationBar'

function CommunityScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets()

  return (
    <Screen
      graphicHeader
      topInset={insets.top}
      navigationBar={<InsideNavigationBar />}
    >
      <></>
    </Screen>
  )
}

export default CommunityScreen
