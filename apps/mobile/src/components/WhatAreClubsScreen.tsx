import {
  Button,
  FaqNoRatings,
  FaqStayAnonymous,
  NavigationBar,
  Screen,
  Stack,
  Typography,
  XmarkCancelClose,
  XStack,
} from '@vexl-next/ui'
import {Array} from 'effect'
import React, {useState} from 'react'
import {
  Pressable,
  TouchableWithoutFeedback,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native'
import {useTranslation} from '../utils/localization/I18nProvider'
import useSafeGoBack from '../utils/useSafeGoBack'
import {type FaqGraphicProps} from './FaqScreen/useContent'

interface WhatAreClubsContent {
  readonly graphic: React.ComponentType<FaqGraphicProps>
  readonly title: string
  readonly text: string
}

function useWhatAreClubsContent(): readonly WhatAreClubsContent[] {
  const {t} = useTranslation()

  return [
    {
      graphic: FaqStayAnonymous,
      title: t('suggestion.whatAreClubs2'),
      text: t('suggestion.whatAreClubs2Text'),
    },
    {
      graphic: FaqNoRatings,
      title: t('suggestion.howDoIJoinClub'),
      text: t('suggestion.howDoIJoinClubText'),
    },
  ]
}

function WhatAreClubsScreen(): React.JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const content = useWhatAreClubsContent()
  const {width: windowWidth} = useWindowDimensions()
  const [page, setPage] = useState(0)
  const pageContent = content[page]

  if (!pageContent) return <></>

  const Graphic = pageContent.graphic
  const isLastPage = page === content.length - 1
  const isFirstPage = page === 0

  const goBack = (): void => {
    if (isFirstPage) safeGoBack()
    else setPage((currentPage) => currentPage - 1)
  }

  const goNext = (): void => {
    if (isLastPage) {
      safeGoBack()
    } else {
      setPage((currentPage) => currentPage + 1)
    }
  }

  const navigateContent = (event: GestureResponderEvent): void => {
    const isPressOnLeftHalf = event.nativeEvent.pageX < windowWidth / 2

    if (isPressOnLeftHalf) {
      if (!isFirstPage) setPage((currentPage) => currentPage - 1)
    } else if (!isLastPage) {
      setPage((currentPage) => currentPage + 1)
    }
  }

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('suggestion.whatAreClubs')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: safeGoBack,
            },
          ]}
        />
      }
    >
      <Stack flex={1}>
        <Pressable onPress={navigateContent} style={{flex: 1}}>
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
              {Array.map(content, (_, index) => (
                <TouchableWithoutFeedback
                  hitSlop={5}
                  key={index}
                  onPress={() => {
                    setPage(index)
                  }}
                >
                  <Stack
                    backgroundColor={
                      index <= page
                        ? '$foregroundPrimary'
                        : '$foregroundTertiary'
                    }
                    borderRadius="$11"
                    flex={1}
                    height="$2"
                    opacity={index <= page ? 1 : 0.55}
                  />
                </TouchableWithoutFeedback>
              ))}
            </XStack>

            <Stack
              alignItems="center"
              flex={1}
              justifyContent="center"
              minHeight={250}
            >
              <Graphic animate disableReplayOnPress />
            </Stack>

            <Stack gap="$3">
              <Typography
                color="$foregroundPrimary"
                letterSpacing={0}
                fontWeight={700}
                variant="heading3"
                maxWidth={280}
              >
                {pageContent.title}
              </Typography>
              <Typography color="$foregroundSecondary" variant="paragraphSmall">
                {pageContent.text}
              </Typography>
            </Stack>
          </Stack>
        </Pressable>

        <XStack gap="$3" paddingVertical="$3">
          {!isFirstPage ? (
            <Button flex={1} onPress={goBack} variant="secondary">
              {t('common.back')}
            </Button>
          ) : null}
          <Button flex={1} onPress={goNext} variant="primary">
            {t(isLastPage ? 'common.close' : 'common.next')}
          </Button>
        </XStack>
      </Stack>
    </Screen>
  )
}

export default WhatAreClubsScreen
