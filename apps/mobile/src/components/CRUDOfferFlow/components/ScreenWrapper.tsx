import {type ReactNode} from 'react'
import {ScrollView} from 'tamagui'

interface Props {
  children: ReactNode
}

function ScreenWrapper({children}: Props): JSX.Element {
  return (
    <ScrollView f={1} bc="$black" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  )
}

export default ScreenWrapper
