import {Text, type TextProps} from 'tamagui'

interface Props extends TextProps {
  active: boolean
  title: string
}

function TabTitle({active, title, ...props}: Props): JSX.Element {
  return (
    <Text
      col={active ? '$main' : '$greyOnBlack'}
      fos={40}
      ff="$heading"
      numberOfLines={1}
      adjustsFontSizeToFit
      {...props}
    >
      {title}
    </Text>
  )
}

export default TabTitle
