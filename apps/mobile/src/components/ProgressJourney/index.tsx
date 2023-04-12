import Button from '../Button'
import {type ReactNode} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import WhiteContainer from '../WhiteContainer'
import {Stack, styled} from 'tamagui'

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

  return (
    <Stack f={1}>
      <WhiteContainer noPadding>
        <Stack f={1} fg={0} fd="row" mx="$2" my="$3">
          {Array.from({length: numberOfPages}).map((_, index) => (
            <BreadCrumb
              testID={'breadcrumb'}
              key={index}
              active={index <= currentPage}
            />
          ))}
        </Stack>
        <Stack f={1} m="$3">
          {children}
        </Stack>
      </WhiteContainer>
      <Stack fd="row" my="$2">
        {withBackButton ? (
          <Button
            fullSize
            onPress={
              currentPage === 0
                ? onFinish
                : () => {
                    onPageChange(currentPage - 1)
                  }
            }
            variant={'primary'}
            text={t(currentPage === 0 ? 'common.close' : 'common.back')}
          />
        ) : (
          <Button
            fullSize
            onPress={currentPage === numberOfPages - 1 ? onFinish : onSkip}
            variant={'primary'}
            text={t('common.skip')}
          />
        )}
        <Stack w="$1" />
        {currentPage === numberOfPages - 1 ? (
          <Button
            fullSize
            onPress={onFinish}
            variant={'secondary'}
            text={t(withBackButton ? 'common.done' : 'common.finish')}
          />
        ) : (
          <Button
            fullSize
            onPress={() => {
              onPageChange(currentPage + 1)
            }}
            variant={'secondary'}
            text={t('common.next')}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default ProgressJourney
