import styled from '@emotion/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type LoginStackParamsList} from '../../index'
import Text from '../../../Text'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Switch from '../../../Switch'
import LottieView from '../../../LottieView'
import WhiteContainer from '../../../WhiteContainer'
import Image from '../../../Image'
import bigNameSvg from './images/bigNameSvg'
import notepadSvg from './images/notepadSvg'
import {useState} from 'react'
import NextButtonPortal from '../NextButtonPortal'
import {useSetHeaderState} from '../../state/headerStateAtom'

const RootContainer = styled.View`
  flex: 1;
`

const WhiteContainerStyled = styled(WhiteContainer)`
  align-items: center;
  padding: 50px 40px;
`
const LottieViewStyled = styled(LottieView)`
  flex: 1;
`

const BigName = styled(Image)`
  width: 200px;
  margin-bottom: 20px;
`

const Subtitle = styled(Text)`
  font-size: 18px;
`

const TOUContainer = styled.View`
  background-color: #131313;
  flex-direction: row;
  justify-content: space-between;
  border-radius: 13px;
  padding: 30px;
  margin: 12px 0;
  align-items: center;
`

const TOUIcon = styled(Image)``

const TOUText = styled(Text)`
  font-size: 18px;
  font-weight: 500;
`

const TOULink = styled(Text)``

const TouSwitch = styled(Switch)``

type Props = NativeStackScreenProps<LoginStackParamsList, 'Start'>

function StartScreen({navigation}: Props): JSX.Element {
  const [touAgree, setTOUAgree] = useState(false)

  const {t} = useTranslation()

  useSetHeaderState(() => ({progressNumber: 1, showBackButton: true}), [])

  return (
    <RootContainer>
      <WhiteContainerStyled>
        <LottieViewStyled
          loop={false}
          autoPlay
          source={require('./lottie/vexl_get_started.json')}
        />
        <BigName width={211} height={66} source={bigNameSvg} />
        <Subtitle fontWeight={500} colorStyle={'grayOnBlack'}>
          {t('loginFlow.start.subtitle')}
        </Subtitle>
      </WhiteContainerStyled>
      <TOUContainer>
        <TOUIcon source={notepadSvg} />
        <TOUText fontWeight={500} colorStyle={'grayOnBlack'}>
          {t('loginFlow.start.touLabel')}{' '}
          <TOULink fontWeight={500} colorStyle={'white'}>
            {t('loginFlow.start.termsOfUse')}
          </TOULink>
        </TOUText>
        <TouSwitch value={touAgree} onValueChange={setTOUAgree} />
      </TOUContainer>
      <NextButtonPortal
        disabled={!touAgree}
        onPress={() => {
          navigation.navigate('AnonymizationNotice')
        }}
        text={t('common.continue')}
      />
    </RootContainer>
  )
}

export default StartScreen
