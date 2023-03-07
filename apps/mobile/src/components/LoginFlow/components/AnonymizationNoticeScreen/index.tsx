import WhiteContainer from '../../../WhiteContainer'
import styled from '@emotion/native'
import Text, {TitleText} from '../../../Text'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import illustrationSvg from './images/illustrationSvg'
import Image from '../../../Image'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'

const ImageStyled = styled(Image)`
  height: 100%;
`
const ImageContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`
const Title = styled(TitleText)`
  margin-bottom: 16px;
`
const TextStyled = styled(Text)``

type Props = LoginStackScreenProps<'AnonymizationNotice'>

function AnonymizationNoticeScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={1} />
      <WhiteContainer>
        <ImageContainer>
          <ImageStyled source={illustrationSvg} />
        </ImageContainer>
        <Title adjustsFontSizeToFit numberOfLines={2}>
          {t('loginFlow.anonymizationNotice.title')}
        </Title>
        <TextStyled colorStyle="gray">
          {t('loginFlow.anonymizationNotice.text')}
        </TextStyled>
      </WhiteContainer>
      <NextButtonProxy
        onPress={() => {
          navigation.navigate('Name')
        }}
        disabled={false}
        text={t('common.continue')}
      />
    </>
  )
}

export default AnonymizationNoticeScreen
