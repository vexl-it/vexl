import React, {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import Svg, {Polygon} from 'react-native-svg'
import {styled} from 'tamagui'

import {Stack, YStack} from '../primitives'

const ScreenFrame = styled(YStack, {
  name: 'Screen',
  flex: 1,
  backgroundColor: '$backgroundPrimary',
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

interface ScreenScrollContextValue {
  readonly scrolled: boolean
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  readonly resetScroll: () => void
}

const ScreenScrollContext = createContext<ScreenScrollContextValue>({
  scrolled: false,
  onScroll: () => {},
  resetScroll: () => {},
})

export function useScreenScroll(): ScreenScrollContextValue {
  return useContext(ScreenScrollContext)
}

const SCROLL_THRESHOLD = 1

export interface ScreenProps {
  readonly navigationBar?: React.ReactNode
  readonly graphicHeader?: boolean
  readonly footer?: React.ReactNode
  readonly topInset?: number
  readonly bottomInset?: number
  readonly children: React.ReactNode
}

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

  const resetScroll = useCallback(() => {
    setScrolled(false)
  }, [])

  const handleNavBarLayout = useCallback((event: LayoutChangeEvent) => {
    setNavBarHeight(event.nativeEvent.layout.height)
  }, [])

  const scrollContext = useMemo(
    () => ({scrolled, onScroll: handleScroll, resetScroll}),
    [scrolled, handleScroll, resetScroll]
  )

  if (graphicHeader) {
    return (
      <ScreenScrollContext.Provider value={scrollContext}>
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
            {navigationBar}
          </Stack>
          <YStack flex={1} paddingTop={navBarHeight}>
            {children}
          </YStack>
          {footer ? (
            <ScreenFooterFrame paddingBottom={bottomInset}>
              {footer}
            </ScreenFooterFrame>
          ) : null}
        </ScreenFrame>
      </ScreenScrollContext.Provider>
    )
  }

  return (
    <ScreenScrollContext.Provider value={scrollContext}>
      <ScreenFrame paddingTop={topInset}>
        {navigationBar}
        <YStack flex={1}>
          {children}
        </YStack>
        {footer ? (
          <ScreenFooterFrame paddingBottom={bottomInset}>
            {footer}
          </ScreenFooterFrame>
        ) : null}
      </ScreenFrame>
    </ScreenScrollContext.Provider>
  )
}
