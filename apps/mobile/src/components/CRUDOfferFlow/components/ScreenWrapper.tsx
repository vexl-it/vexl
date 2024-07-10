import {ScrollView, type ScrollViewProps} from 'tamagui'

function ScreenWrapper({children, ...props}: ScrollViewProps): JSX.Element {
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
