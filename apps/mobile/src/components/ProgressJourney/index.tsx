import {useCallback, type ReactNode} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, XStack, styled} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import WhiteContainer from '../WhiteContainer'

const BreadCrumb = styled(Stack, {
  h: 4,
  f: 1,
  bg: '$backgroundBlack',
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
  } as const,
})

export interface Props {
  numberOfPages: number
  currentPage: number
  onPageChange: (newPageNumber: number) => void
  onFinish: () => void
  onSkip: () => void
  children: ReactNode
  withBackButton?: boolean
}

function ProgressJourney({
  numberOfPages,
  currentPage,
  onPageChange,
  onFinish,
  onSkip,
  children,
  withBackButton,
}: Props): JSX.Element {
  const {t} = useTranslation()

  const onNextOrFinish = useCallback(() => {
    if (currentPage === numberOfPages - 1) {
      onFinish()
    }
    onPageChange(currentPage + 1)
  }, [currentPage, numberOfPages, onFinish, onPageChange])

  const onBackOrSkip = useCallback(() => {
    if (withBackButton) {
      if (currentPage === 0) onFinish()
      else onPageChange(currentPage - 1)
    } else {
      if (currentPage === numberOfPages - 1) onFinish()
      else onSkip()
    }
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
      <WhiteContainer noPadding>
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
              <BreadCrumb active={index <= currentPage} />
            </TouchableWithoutFeedback>
          ))}
        </Stack>
        <Stack f={1} m="$3" position="relative">
          {children}
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
        </Stack>
      </WhiteContainer>
      <Stack fd="row" my="$2">
        {withBackButton ? (
          <Button
            fullSize
            onPress={onBackOrSkip}
            variant="primary"
            text={t(currentPage === 0 ? 'common.close' : 'common.back')}
          />
        ) : (
          <Button
            fullSize
            onPress={onBackOrSkip}
            variant="primary"
            text={t('common.skip')}
          />
        )}
        <Stack w="$1" />
        {currentPage === numberOfPages - 1 ? (
          <Button
            fullSize
            onPress={onNextOrFinish}
            variant="secondary"
            text={t(withBackButton ? 'common.done' : 'common.finish')}
          />
        ) : (
          <Button
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
