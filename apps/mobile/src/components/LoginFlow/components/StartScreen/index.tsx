import styled from '@emotion/native'
import Text from '../../../Text'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Switch from '../../../Switch'
import LottieView from '../../../LottieView'
import WhiteContainer from '../../../WhiteContainer'
import Image from '../../../Image'
import bigNameSvg from './images/bigNameSvg'
import notepadSvg from './images/notepadSvg'
import {useState} from 'react'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import Button from '../../../Button'
import Spacer from '../../../Spacer'

const RootContainer = styled.View`
  flex: 1;
  background-color: ${({theme}) => theme.colors.backgroundBlack};
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

const TOUMessageContainer = styled.View`
  flex-direction: row;
  align-items: center;
`

const TOUIcon = styled(Image)``

const TOUText = styled(Text)`
  font-size: 18px;
  font-weight: 500;
`

const TouSwitch = styled(Switch)``

type Props = LoginStackScreenProps<'Start'>

function StartScreen({navigation}: Props): JSX.Element {
  const [touAgree, setTOUAgree] = useState(false)

  const {t} = useTranslation()

  return (
    <RootContainer>
      <HeaderProxy showBackButton={true} progressNumber={undefined} />
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
        <TOUMessageContainer>
          <TOUIcon source={notepadSvg} />
          <Spacer x$={2} />
          <TOUText fontWeight={500} colorStyle={'grayOnBlack'}>
            {t('loginFlow.start.touLabel')}{' '}
          </TOUText>
          <Button
            fontSize={18}
            variant="link"
            onPress={() => {
              navigation.navigate('TermsAndConditions')
            }}
            text={t('loginFlow.start.termsOfUse')}
          />
        </TOUMessageContainer>
        <TouSwitch value={touAgree} onValueChange={setTOUAgree} />
      </TOUContainer>
      <NextButtonProxy
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
