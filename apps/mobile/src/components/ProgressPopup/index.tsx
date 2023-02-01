import styled from '@emotion/native'
import Button from '../Button'
import {type ReactNode} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'

const RootContainer = styled.View`
  flex: 1;
  padding: 0 8px;
`

const WhiteArea = styled.View`
  background-color: ${(p) => p.theme.colors.backgroundWhite};
  flex: 1;
  border-radius: 13px;
`
const ButtonsContainer = styled.View`
  flex-direction: row;
  margin: 8px 0;
`

const ButtonsSpacer = styled.View`
  width: 8px;
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
  flex-direction: column-reverse;
`

export interface Props {
  numberOfPages: number
  currentPage: number
  onNext: (newPageNumber: number) => void
  onFinish: () => void
  onSkip: () => void
  children: ReactNode
}

function ProgressPopup({
  numberOfPages,
  currentPage,
  onNext,
  onFinish,
  onSkip,
  children,
}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <RootContainer>
      <WhiteArea>
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
      </WhiteArea>
      <ButtonsContainer>
        <Button
          onPress={currentPage === numberOfPages - 1 ? onFinish : onSkip}
          variant={'secondary'}
          text={t('common.skip')}
        />
        <ButtonsSpacer />
        {currentPage === numberOfPages - 1 ? (
          <Button
            onPress={onFinish}
            variant={'primary'}
            text={t('common.finish')}
          />
        ) : (
          <Button
            onPress={() => { onNext(currentPage + 1); }}
            variant={'primary'}
            text={t('common.next')}
          />
        )}
      </ButtonsContainer>
    </RootContainer>
  )
}

export default ProgressPopup
