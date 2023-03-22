import {css} from '@emotion/native'
import {ScrollView, type StyleProp, View, type ViewStyle} from 'react-native'
import {type ReactNode} from 'react'
import {useTheme} from '@emotion/react'
import usePixelsFromBottomWhereTabsEnd from '../utils'

export const CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING = 24

interface Props {
  style?: StyleProp<ViewStyle>
  children: ReactNode
  scrollView?: boolean
  withTopPadding?: boolean
}

function ContainerWithTopBorderRadius({
  style,
  children,
  scrollView,
  withTopPadding,
}: Props): JSX.Element {
  const theme = useTheme()
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  const styleToUse = [
    css`
      background-color: ${theme.colors.black};
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      ${withTopPadding &&
      `padding-top: ${CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING}px;`}
      flex: 1;
    `,
    style,
  ]

  if (scrollView) {
    return (
      <ScrollView
        style={css`
          background-color: ${theme.colors.black};
          flex: 1;
        `}
        contentContainerStyle={[
          styleToUse,
          css`
            flex: none;
            padding-bottom: ${String(tabBarEndsAt + 20)}px;
          `,
        ]}
      >
        {children}
      </ScrollView>
    )
  }
  return <View style={styleToUse}>{children}</View>
}

export default ContainerWithTopBorderRadius
