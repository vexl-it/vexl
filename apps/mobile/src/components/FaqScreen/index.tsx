import {
  Button,
  NavigationBar,
  Screen,
  Stack,
  Typography,
  XStack,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import React, {useState} from 'react'
import {
  Pressable,
  TouchableWithoutFeedback,
  type GestureResponderEvent,
} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import useContent, {type FaqContent, type FaqType} from './useContent'

type Props = RootStackScreenProps<'Faqs'>

function getInitialPage(
  content: readonly FaqContent[],
  pageType: FaqType | undefined
): number {
  if (!pageType) return 0

  return pipe(
    content,
    Array.findFirstIndex((one) => one.type === pageType),
    Option.getOrElse(() => 0)
  )
}

function FaqsScreen({route: {params}}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const content = useContent()
  const [page, setPage] = useState<number>(() =>
    getInitialPage(content, params?.pageType)
  )
  const [contentWidth, setContentWidth] = useState(0)
  const pageContent = content[page]

  if (!pageContent) return null

  const Graphic = pageContent.graphic
  const isLastPage = page === content.length - 1
  const isFirstPage = page === 0

  const goBack = (): void => {
    if (page === 0) safeGoBack()
    else setPage((currentPage) => currentPage - 1)
  }

  const goNext = (): void => {
    if (isLastPage) safeGoBack()
    else setPage((currentPage) => currentPage + 1)
  }

  const navigateContent = (event: GestureResponderEvent): void => {
    if (contentWidth === 0) return

    const isPressOnLeftHalf = event.nativeEvent.locationX < contentWidth / 2

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
          title={t('faqs.faqsTitle')}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <Stack flex={1}>
        <Pressable
          onLayout={(event) => {
            setContentWidth(event.nativeEvent.layout.width)
          }}
          onPress={navigateContent}
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
              {pipe(
                content,
                Array.map((_, index) => (
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
                ))
              )}
            </XStack>

            <Stack
              alignItems="center"
              flex={1}
              justifyContent="center"
              minHeight={250}
            >
              <Graphic animate />
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
            {t(isLastPage ? 'common.done' : 'common.next')}
          </Button>
        </XStack>
      </Stack>
    </Screen>
  )
}

export default FaqsScreen
