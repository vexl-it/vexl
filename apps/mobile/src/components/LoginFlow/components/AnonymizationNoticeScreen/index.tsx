import WhiteContainer from '../../../WhiteContainer'
import styled from '@emotion/native'
import Text, {TitleText} from '../../../Text'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type LoginStackParamsList} from '../../index'
import illustrationSvg from './images/illustrationSvg'
import Image from '../../../Image'
import NextButtonPortal from '../NextButtonPortal'
import {useSetHeaderState} from '../../state/headerStateAtom'
import {useCallback} from 'react'

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

type Props = NativeStackScreenProps<LoginStackParamsList, 'AnonymizationNotice'>

function AnonymizationNoticeScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  useSetHeaderState(
    useCallback(() => ({progressNumber: 1, showBackButton: true}), [])
  )

  return (
    <>
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
      <NextButtonPortal
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
