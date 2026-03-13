import {navBarHeightAtom} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {createContext, useCallback, useContext, useMemo} from 'react'
import {type NativeScrollEvent, type NativeSyntheticEvent} from 'react-native'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'
import {Stack} from 'tamagui'
import {GraphicHeaderDecoration} from '../../GraphicHeaderDecoration'
import InsideNavigationBar from './InsideNavigationBar'

interface InsideScreenScrollContextValue {
  readonly scrollY: SharedValue<number>
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const InsideScreenScrollContext =
  createContext<InsideScreenScrollContextValue | null>(null)

export function useInsideScreenScroll(): InsideScreenScrollContextValue {
  const value = useContext(InsideScreenScrollContext)
  if (!value) {
    throw new Error('useInsideScreenScroll must be used within an InsideScreen')
  }
  return value
}

export function InsideScreenListHeader({
  children,
}: {
  readonly children?: React.ReactNode
}): React.JSX.Element {
  const navBarHeight = useAtomValue(navBarHeightAtom)

  return (
    <Stack>
      <GraphicHeaderDecoration />
      <Stack height={navBarHeight} />
      {children}
    </Stack>
  )
}

export function InsideScreen({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  const scrollY = useSharedValue(0)

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y
    },
    [scrollY]
  )

  const contextValue = useMemo(() => ({scrollY, onScroll}), [scrollY, onScroll])

  return (
    <InsideScreenScrollContext.Provider value={contextValue}>
      <Stack f={1} backgroundColor="$backgroundPrimary">
        <Stack position="absolute" top={0} left={0} right={0} zIndex={1}>
          <InsideNavigationBar title={title} scrollY={scrollY} />
        </Stack>
        {children}
      </Stack>
    </InsideScreenScrollContext.Provider>
  )
}
