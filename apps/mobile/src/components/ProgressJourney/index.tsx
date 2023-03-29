import styled from '@emotion/native'
import Button from '../Button'
import {type ReactNode} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import WhiteContainer from '../WhiteContainer'
import Spacer from '../Spacer'

const RootContainer = styled.View`
  flex: 1;
`

const ButtonsContainer = styled.View`
  flex-direction: row;
  margin: 8px 0;
`

const WhiteContainerStyled = styled(WhiteContainer)`
  padding: 0;
`

const BreadcrumbsContainer = styled.View`
  flex-direction: row;
  flex: 1;
  flex-grow: 0;
  margin: 12px 8px;
`

const BreadCrumb = styled.View`
  height: 4px;
  flex: 1;
  background-color: #101010;
  margin: 0 4px;
  border-radius: 36px;
  ${(props: {active: boolean}) =>
    props.active ? `opacity: 1;` : `opacity: 0.2;`}
`

const ChildrenContainer = styled.View`
  margin: 16px;
  flex: 1;
`

const StyledButton = styled(Button)`
  flex: 1;
`

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
    <RootContainer>
      <WhiteContainerStyled>
        <BreadcrumbsContainer>
          {Array.from({length: numberOfPages}).map((_, index) => (
            <BreadCrumb
              testID={'breadcrumb'}
              key={index}
              active={index <= currentPage}
            />
          ))}
        </BreadcrumbsContainer>
        <ChildrenContainer>{children}</ChildrenContainer>
      </WhiteContainerStyled>
      <ButtonsContainer>
        {withBackButton ? (
          <StyledButton
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
          <StyledButton
            onPress={currentPage === numberOfPages - 1 ? onFinish : onSkip}
            variant={'primary'}
            text={t('common.skip')}
          />
        )}
        <Spacer x$={2} />
        {currentPage === numberOfPages - 1 ? (
          <StyledButton
            onPress={onFinish}
            variant={'secondary'}
            text={t(withBackButton ? 'common.done' : 'common.finish')}
          />
        ) : (
          <StyledButton
            onPress={() => {
              onPageChange(currentPage + 1)
            }}
            variant={'secondary'}
            text={t('common.next')}
          />
        )}
      </ButtonsContainer>
    </RootContainer>
  )
}

export default ProgressJourney
