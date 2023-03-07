import Text, {TitleText} from '../../../Text'
import styled from '@emotion/native'
import AnonymizationCaption from '../../../AnonymizationCaption/AnonymizationCaption'
import WhiteContainer from '../../../WhiteContainer'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import PhoneNumberInput from './components/PhoneNumberInput'
import * as O from 'fp-ts/Option'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import * as E from 'fp-ts/Either'
import {Alert} from 'react-native'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import {useInitPhoneVerification} from '../../api/initPhoneVerification'
import {useState} from 'react'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'

const WhiteContainerStyled = styled(WhiteContainer)``
const TitleStyled = styled(TitleText)``
const TextStyled = styled(Text)`
  margin-top: 12px;
  font-size: 14px;
`
const InputStyled = styled(PhoneNumberInput)`
  margin-top: 18px;
  margin-bottom: 16px;
`
const AnonymizationCaptionStyled = styled(AnonymizationCaption)``

type Props = LoginStackScreenProps<'PhoneNumber'>

function PhoneNumberScreen({
  navigation,
  route: {
    params: {anonymizedUserData, realUserData},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const [phoneNumber, setPhoneNumber] = useState<O.Option<E164PhoneNumber>>(
    O.none
  )
  const loadingOverlay = useShowLoadingOverlay()
  const initPhoneVerification = useInitPhoneVerification()

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={2} />
      <WhiteContainerStyled>
        <TitleStyled>{t('loginFlow.phoneNumber.title')}</TitleStyled>
        <TextStyled colorStyle={'gray'}>
          {t('loginFlow.phoneNumber.text')}
        </TextStyled>
        <InputStyled onChange={setPhoneNumber} />
        <AnonymizationCaptionStyled fontSize={14} />
      </WhiteContainerStyled>
      <NextButtonProxy
        disabled={phoneNumber._tag === 'None'}
        onPress={() => {
          if (phoneNumber._tag !== 'Some') return

          loadingOverlay.show()
          void initPhoneVerification({phoneNumber: phoneNumber.value})()
            .then(
              E.match(Alert.alert, (result) => {
                navigation.navigate('VerificationCode', {
                  realUserData,
                  anonymizedUserData,
                  phoneNumber: phoneNumber.value,
                  initPhoneVerificationResponse: result,
                })
              })
            )
            .finally(loadingOverlay.hide)
        }}
        text={t('common.continue')}
      />
    </>
  )
}

export default PhoneNumberScreen
