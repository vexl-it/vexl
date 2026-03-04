import React, {useCallback, useState} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
} from 'react-native'
import Svg, {Polygon} from 'react-native-svg'
import {styled} from 'tamagui'

import {Stack, YStack} from '../primitives'

const ScreenFrame = styled(YStack, {
  name: 'Screen',
  flex: 1,
  backgroundColor: '$backgroundPrimary',
})

const ScreenContentPadding = styled(YStack, {
  name: 'ScreenContentPadding',
  paddingHorizontal: '$5',
  flexGrow: 1,
})

const ScreenFooterFrame = styled(Stack, {
  name: 'ScreenFooter',
  paddingHorizontal: '$5',
  paddingTop: '$5',
  paddingBottom: '$8',
})

const GRAPHIC_WIDTH = 156
const GRAPHIC_HEIGHT = 145

const GRAPHIC_FILL = '#363636'
const GRAPHIC_OPACITY = 0.25

function GraphicHeaderDecoration(): React.JSX.Element {
  return (
    <Stack
      position="absolute"
      top={0}
      left={0}
      width={GRAPHIC_WIDTH}
      height={GRAPHIC_HEIGHT}
    >
      <Svg width={GRAPHIC_WIDTH} height={GRAPHIC_HEIGHT} viewBox="0 0 156 145">
        <Polygon
          points="0,6 139,145 0,145"
          fill={GRAPHIC_FILL}
          opacity={GRAPHIC_OPACITY}
        />
        <Polygon
          points="75,0 156,81 75,81"
          fill={GRAPHIC_FILL}
          opacity={GRAPHIC_OPACITY}
        />
      </Svg>
    </Stack>
  )
}

export interface ScreenProps {
  readonly navigationBar?:
    | React.ReactNode
    | ((scrolled: boolean) => React.ReactNode)
  readonly graphicHeader?: boolean
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
  readonly topInset?: number
  readonly bottomInset?: number
}

const SCROLL_THRESHOLD = 1

export function Screen({
  navigationBar,
  graphicHeader,
  children,
  footer,
  topInset,
  bottomInset,
}: ScreenProps): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false)
  const [navBarHeight, setNavBarHeight] = useState(0)

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrolled(event.nativeEvent.contentOffset.y > SCROLL_THRESHOLD)
    },
    []
  )

  const handleNavBarLayout = useCallback((event: LayoutChangeEvent) => {
    setNavBarHeight(event.nativeEvent.layout.height)
  }, [])

  const resolvedNavigationBar =
    typeof navigationBar === 'function'
      ? navigationBar(scrolled)
      : navigationBar

  if (graphicHeader) {
    return (
      <ScreenFrame>
        <GraphicHeaderDecoration />
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={1}
          paddingTop={topInset}
          onLayout={handleNavBarLayout}
          backgroundColor={scrolled ? '$backgroundSecondary' : '$transparent'}
        >
          {resolvedNavigationBar}
        </Stack>
        <ScrollView
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{flexGrow: 1}}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <ScreenContentPadding
            paddingTop={navBarHeight}
            paddingBottom={bottomInset}
          >
            {children}
          </ScreenContentPadding>
        </ScrollView>
        {footer ? (
          <ScreenFooterFrame paddingBottom={bottomInset}>
            {footer}
          </ScreenFooterFrame>
        ) : null}
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame paddingTop={topInset}>
      {resolvedNavigationBar}
      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}
      >
        <ScreenContentPadding paddingBottom={bottomInset}>
          {children}
        </ScreenContentPadding>
      </ScrollView>
      {footer ? (
        <ScreenFooterFrame paddingBottom={bottomInset}>
          {footer}
        </ScreenFooterFrame>
      ) : null}
    </ScreenFrame>
  )
}
