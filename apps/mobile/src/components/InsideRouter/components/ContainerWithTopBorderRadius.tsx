import React, {type ReactNode} from 'react'
import {ScrollView, Stack, type StackProps} from 'tamagui'
import usePixelsFromBottomWhereTabsEnd from '../utils'

export const CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING = 24

interface Props extends StackProps {
  children: ReactNode
  scrollView?: boolean
}

function ContainerWithTopBorderRadius({
  children,
  scrollView,
  ...props
}: Props): React.ReactElement {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  if (scrollView) {
    return (
      <ScrollView
        bg="$black"
        btlr="$7"
        btrr="$7"
        pt="$6"
        px="$1"
        contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
      >
        {children}
      </ScrollView>
    )
  }
  return (
    <Stack f={1} bc="$black" btlr="$7" btrr="$7" pt="$6" px="$1" {...props}>
      {children}
    </Stack>
  )
}

export default ContainerWithTopBorderRadius
