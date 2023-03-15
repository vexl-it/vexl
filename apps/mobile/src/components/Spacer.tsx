import {View} from 'react-native'
import {css} from '@emotion/native'

export interface Props {
  x$?: number
  y$?: number
}
function Spacer({x$, y$}: Props): JSX.Element {
  return (
    <View
      style={css`
        ${x$ !== undefined && `width: ${x$ * 4}px;`}
        ${y$ !== undefined && `height: ${y$ * 4}px;`}
      `}
    ></View>
  )
}

export default Spacer
