import React from 'react'
import {ScrollView, type ScrollViewProps} from 'tamagui'

function ScreenWrapper({
  children,
  ...props
}: ScrollViewProps): React.ReactElement {
  return (
    <ScrollView
      f={1}
      bc="$black"
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  )
}
export default ScreenWrapper
