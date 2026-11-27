import {Array, Option, pipe} from 'effect'
import React, {useEffect, useRef, useState} from 'react'
import {ScrollView} from 'react-native'
import {getTokens} from 'tamagui'

import {Stack} from '../primitives'
import {PageIndicator} from './PageIndicator'

export interface BannerCarouselPage {
  readonly key: string
  readonly label: string
  readonly content: React.ReactNode
}

export interface BannerCarouselProps {
  readonly pages: readonly BannerCarouselPage[]
  readonly activeKey: string | undefined
  readonly onActiveKeyChange: (key: string) => void
}

export function BannerCarousel({
  pages,
  activeKey,
  onActiveKeyChange,
}: BannerCarouselProps): React.JSX.Element {
  const activeIndex = pipe(
    pages,
    Array.findFirstIndex((page) => page.key === activeKey),
    Option.getOrElse(() => 0)
  )
  const [width, setWidth] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const didPositionRef = useRef(false)
  const positionedLayoutRef = useRef('')
  const initialPageIndex = useRef(activeIndex)
  const tokens = getTokens()
  const gap = tokens.space.$3.val
  const pageWidth = Math.max(0, width - tokens.space.$7.val)
  const interval = pageWidth + gap

  const layoutKey = `${width}:${Array.map(pages, (page) => page.key).join('|')}`
  useEffect(() => {
    if (width === 0 || positionedLayoutRef.current === layoutKey) return
    positionedLayoutRef.current = layoutKey
    scrollRef.current?.scrollTo({x: activeIndex * interval, animated: false})
    didPositionRef.current = true
  }, [activeIndex, interval, layoutKey, width])

  return (
    <Stack
      gap="$3"
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width)
      }}
    >
      {width > 0 ? (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={interval}
            decelerationRate="fast"
            disableIntervalMomentum
            // Measure natural content height, then stretch every page to the
            // tallest one. Measuring inside a fixed height can collapse it.
            style={{flexGrow: 0, flexShrink: 0}}
            contentContainerStyle={{
              alignItems: 'stretch',
              gap,
              paddingRight: width - pageWidth,
            }}
            contentOffset={{x: initialPageIndex.current * interval, y: 0}}
            scrollEventThrottle={16}
            onScroll={(event) => {
              if (!didPositionRef.current) return
              const index = Math.round(
                event.nativeEvent.contentOffset.x / interval
              )
              const page = pages[Math.max(0, Math.min(pages.length - 1, index))]
              if (page !== undefined && page.key !== activeKey)
                onActiveKeyChange(page.key)
            }}
          >
            {Array.map(pages, (page) => (
              <Stack key={page.key} width={pageWidth}>
                {page.content}
              </Stack>
            ))}
          </ScrollView>
          <PageIndicator
            pages={pages}
            activeIndex={activeIndex}
            onSelect={(index) => {
              scrollRef.current?.scrollTo({x: index * interval, animated: true})
            }}
          />
        </>
      ) : null}
    </Stack>
  )
}
