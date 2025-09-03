import React, {useCallback, type ReactNode} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, XStack, styled} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'

const BreadCrumb = styled(Stack, {
  h: 4,
  f: 1,
  mx: '$1',
  br: '$11',
  variants: {
    active: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 0.2,
      },
    },
    whiteBackground: {
      true: {
        bg: '$backgroundBlack',
      },
      false: {
        bg: '$main',
      },
    },
  } as const,
})

export interface Props {
  numberOfPages: number
  background?: 'white' | 'black'
  currentPage: number
  onPageChange: (newPageNumber: number) => void
  onFinish: () => void
  onSkip: () => void
  children: ReactNode
  withBackButton?: boolean
  touchableOverlayDisabled?: boolean
}

function ProgressJourney({
  numberOfPages,
  background = 'white',
  currentPage,
  onPageChange,
  onFinish,
  onSkip,
  children,
  withBackButton,
  touchableOverlayDisabled = false,
}: Props): React.ReactElement {
  const {t} = useTranslation()

  const onNextOrFinish = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      if (currentPage === numberOfPages - 1) {
        onFinish()
      }
      onPageChange(currentPage + 1)
    })
  }, [currentPage, numberOfPages, onFinish, onPageChange])

  const onBackOrSkip = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      if (withBackButton) {
        if (currentPage === 0) onSkip()
        else onPageChange(currentPage - 1)
      } else {
        if (currentPage === numberOfPages - 1) onFinish()
        else onSkip()
      }
    })
  }, [
    currentPage,
    numberOfPages,
    onFinish,
    onPageChange,
    onSkip,
    withBackButton,
  ])

  return (
    <Stack f={1}>
      <Stack f={1} br="$5" bc={background === 'white' ? '$white' : '$black'}>
        <Stack f={1} fg={0} fd="row" mx="$2" my="$3">
          {Array.from({length: numberOfPages}).map((_, index) => (
            <TouchableWithoutFeedback
              testID="breadcrumb"
              key={index}
              onPress={() => {
                onPageChange(index)
              }}
              hitSlop={5}
            >
              <BreadCrumb
                active={index <= currentPage}
                whiteBackground={background === 'white'}
              />
            </TouchableWithoutFeedback>
          ))}
        </Stack>
        <Stack f={1} m="$3" position="relative">
          {children}
          {!touchableOverlayDisabled && (
            <XStack
              f={1}
              position="absolute"
              top={0}
              left={0}
              bottom={0}
              right={0}
              mt="$10"
            >
              <TouchableWithoutFeedback onPress={onBackOrSkip}>
                <Stack f={1} />
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={onNextOrFinish}>
                <Stack f={1} />
              </TouchableWithoutFeedback>
            </XStack>
          )}
        </Stack>
      </Stack>
      <Stack fd="row" my="$2">
        {withBackButton ? (
          <Button
            testID="@progressJourney/closeBackButton"
            fullSize
            onPress={onBackOrSkip}
            variant="primary"
            text={t(currentPage === 0 ? 'common.close' : 'common.back')}
          />
        ) : (
          <Button
            testID="@progressJourney/skipButton"
            fullSize
            onPress={onBackOrSkip}
            variant="primary"
            text={t('common.skip')}
          />
        )}
        <Stack w="$1" />
        {currentPage === numberOfPages - 1 ? (
          <Button
            testID="@progressJourney/doneFinishButton"
            fullSize
            onPress={onNextOrFinish}
            variant="secondary"
            text={t(withBackButton ? 'common.done' : 'common.finish')}
          />
        ) : (
          <Button
            testID="@progressJourney/nextButton"
            fullSize
            onPress={onNextOrFinish}
            variant="secondary"
            text={t('common.next')}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default ProgressJourney
