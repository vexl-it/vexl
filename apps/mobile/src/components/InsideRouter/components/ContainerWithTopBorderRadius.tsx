import {type StyleProp, type ViewStyle} from 'react-native'
import {type ReactNode} from 'react'
import usePixelsFromBottomWhereTabsEnd from '../utils'
import {ScrollView, Stack, styled} from 'tamagui'

export const CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING = 24

const StyledStack = styled(Stack, {
  f: 1,
  bg: '$black',
  btlr: '$7',
  btrr: '$7',
  variants: {
    withTopPadding: {
      true: {
        pt: '$6',
      },
    },
  },
})

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
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  if (scrollView) {
    return (
      <ScrollView
        fullscreen
        bg="$black"
        btlr="$7"
        btrr="$7"
        pt={withTopPadding ? '$6' : '$0'}
        contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
      >
        {children}
      </ScrollView>
    )
  }
  return <StyledStack withTopPadding={withTopPadding}>{children}</StyledStack>
}

export default ContainerWithTopBorderRadius
