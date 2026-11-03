import {Array} from 'effect'
import React, {useRef, useState} from 'react'
import {Pressable, type GestureResponderEvent, type View} from 'react-native'
import {Stack, XStack} from '../primitives'
import {Button} from './Button'
import {Typography} from './Typography'

export interface StoryPagerGraphicProps {
  readonly animate?: boolean
  readonly disableReplayOnPress?: boolean
}

export interface StoryPage {
  readonly graphic: React.ComponentType<StoryPagerGraphicProps>
  readonly title: string
  readonly text: string
}

export interface StoryPagerProps {
  readonly pages: readonly StoryPage[]
  readonly initialPage?: number
  readonly backLabel: string
  readonly nextLabel: string
  readonly finishLabel: string
  readonly onFinish: () => void
}

export function StoryPager({
  pages,
  initialPage = 0,
  backLabel,
  nextLabel,
  finishLabel,
  onFinish,
}: StoryPagerProps): React.JSX.Element | null {
  const pressAreaRef = useRef<View>(null)
  const [page, setPage] = useState(initialPage)
  const pageContent = pages[page]

  if (!pageContent) return null

  const Graphic = pageContent.graphic
  const isFirstPage = page === 0
  const isLastPage = page === pages.length - 1

  const goBack = (): void => {
    if (!isFirstPage) setPage(page - 1)
  }

  const goNext = (): void => {
    if (!isLastPage) setPage(page + 1)
  }

  const navigateByPressSide = (event: GestureResponderEvent): void => {
    const {pageX} = event.nativeEvent
    pressAreaRef.current?.measureInWindow((x, _y, width) => {
      if (pageX < x + width / 2) goBack()
      else goNext()
    })
  }

  return (
    <Stack flex={1}>
      <Pressable
        ref={pressAreaRef}
        onPress={navigateByPressSide}
        style={{flex: 1}}
      >
        <Stack
          flex={1}
          backgroundColor="$backgroundTertiary"
          borderRadius="$4"
          overflow="hidden"
          paddingHorizontal="$5"
          paddingTop="$4"
          paddingBottom="$6"
        >
          <XStack gap="$2">
            {Array.map(pages, (_, index) => (
              <Stack
                key={index}
                flex={1}
                height="$2"
                borderRadius="$11"
                hitSlop={5}
                backgroundColor={
                  index <= page ? '$foregroundPrimary' : '$foregroundTertiary'
                }
                opacity={index <= page ? 1 : 0.55}
                onPress={() => {
                  setPage(index)
                }}
              />
            ))}
          </XStack>

          <Stack
            flex={1}
            minHeight={250}
            alignItems="center"
            justifyContent="center"
          >
            <Graphic animate disableReplayOnPress />
          </Stack>

          <Stack gap="$3">
            <Typography
              variant="heading3"
              color="$foregroundPrimary"
              letterSpacing={0}
              fontWeight={700}
              maxWidth={280}
            >
              {pageContent.title}
            </Typography>
            <Typography variant="paragraphSmall" color="$foregroundSecondary">
              {pageContent.text}
            </Typography>
          </Stack>
        </Stack>
      </Pressable>

      <XStack gap="$3" paddingVertical="$3">
        {!isFirstPage ? (
          <Button flex={1} variant="secondary" onPress={goBack}>
            {backLabel}
          </Button>
        ) : null}
        <Button
          flex={1}
          variant="primary"
          onPress={isLastPage ? onFinish : goNext}
        >
          {isLastPage ? finishLabel : nextLabel}
        </Button>
      </XStack>
    </Stack>
  )
}
