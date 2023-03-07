import WhiteContainer from '../../../WhiteContainer'
import styled from '@emotion/native'
import Image from '../../../Image'
import Text, {TitleText} from '../../../Text'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import importContactsSvg from './image/importContactsSvg'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {type PostLoginFlowScreenProps} from '../../../../navigationTypes'

const ImageStyled = styled(Image)`
  margin-bottom: 16px;
`

const WhiteContainerStyled = styled(WhiteContainer)`
  justify-content: space-between;
  align-items: center;
`

const TextContainerStyled = styled.View`
  align-self: stretch;
`

const TitleStyled = styled(TitleText)`
  margin-bottom: 12px;
`
const TextStyled = styled(Text)`
  font-size: 16px;
  margin-bottom: 24px;
`
const AnonymizationCaptionStyled = styled(AnonymizationCaption)``

type Props = PostLoginFlowScreenProps<'ImportContactsExplanation'>
export default function ImportContactsExplanation({
  navigation,
}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <WhiteContainerStyled>
      <HeaderProxy showBackButton={false} progressNumber={3} />
      <ImageStyled source={importContactsSvg} />
      <TextContainerStyled>
        <TitleStyled>
          {t('postLoginFlow.contactsExplanation.title')}
        </TitleStyled>
        <TextStyled colorStyle={'grayOnWhite'}>
          {t('postLoginFlow.contactsExplanation.text')}
        </TextStyled>
        <AnonymizationCaptionStyled
          text={t('postLoginFlow.contactsExplanation.anonymizationCaption')}
        />
      </TextContainerStyled>
      <NextButtonProxy
        text={t('postLoginFlow.importContactsButton')}
        onPress={() => {
          navigation.push('ImportContacts')
        }}
        disabled={false}
      />
    </WhiteContainerStyled>
  )
}
