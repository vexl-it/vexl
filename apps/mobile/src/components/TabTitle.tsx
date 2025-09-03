import React from 'react'
import {Text, type TextProps} from 'tamagui'

interface Props extends TextProps {
  active: boolean
  title: string
}

function TabTitle({active, title, ...props}: Props): React.ReactElement {
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
