import styled from '@emotion/native'
import Text, {TitleText} from '../../../Text'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type LoginStackParamsList} from '../../index'
import WhiteContainer from '../../../WhiteContainer'
import TextInput from '../../../Input'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {useState} from 'react'
import * as crypto from '@vexl-next/cryptography'
import {useVerifyPhoneNumber} from '../../api/verifyPhoneNumber'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import reportError from '../../../../utils/reportError'
import {Alert, TouchableWithoutFeedback} from 'react-native'
import {serializePrivateKey} from '../../utils'
import NextButtonPortal from '../NextButtonPortal'
import {useSetHeaderState} from '../../state/headerStateAtom'
import Countdown from './components/Countdown'
import {DateTime} from 'luxon'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'

const WhiteContainerStyled = styled(WhiteContainer)``
const Title = styled(TitleText)`
  margin-bottom: 12px;
`
const TextStyled = styled(Text)`
  font-size: 14px;
`
const InputStyled = styled(TextInput)`
  margin-top: 24px;
  margin-bottom: 24px;
`
const ResendText = styled(Text)`
  text-align: center;
  font-size: 14px;
`

const CountdownStyled = styled(Countdown)`
  font-size: 14px;
`

type Props = NativeStackScreenProps<LoginStackParamsList, 'VerificationCode'>

function VerificationCodeScreen({
  navigation,
  route: {
    params: {
      phoneNumber,
      initPhoneVerificationResponse,
      anonymizedUserData,
      realUserData,
    },
  },
}: Props): JSX.Element {
  const [userCode, setUserCode] = useState('')
  const [countdownFinished, setCountdownFinished] = useState(false)
  const verifyPhoneNumber = useVerifyPhoneNumber()
  const {t} = useTranslation()
  const loadingOverlay = useShowLoadingOverlay()

  useSetHeaderState(
    () => ({
      showBackButton: true,
      progressNumber: 2,
    }),
    []
  )

  return (
    <>
      <WhiteContainerStyled>
        <Title>{t('loginFlow.verificationCode.title')}</Title>
        <TextStyled colorStyle="gray">
          {t('loginFlow.verificationCode.text')}{' '}
          <TextStyled>
            {parsePhoneNumber(phoneNumber).number?.international}
          </TextStyled>
        </TextStyled>
        <InputStyled
          keyboardType="number-pad"
          value={userCode}
          onChangeText={(v) => {
            setUserCode(v.substring(0, 6))
          }}
          placeholder={t('loginFlow.verificationCode.inputPlaceholder')}
        />
        {countdownFinished ? (
          <TouchableWithoutFeedback onPress={navigation.goBack}>
            <ResendText>{t('loginFlow.verificationCode.retry')}</ResendText>
          </TouchableWithoutFeedback>
        ) : (
          <ResendText colorStyle="gray">
            <>
              {t('loginFlow.verificationCode.retryCountdown')}{' '}
              <CountdownStyled
                colorStyle={'gray'}
                countUntil={DateTime.fromISO(
                  initPhoneVerificationResponse.expirationAt
                )}
                onFinished={() => {
                  setCountdownFinished(true)
                }}
              />
              {t('common.secondsShort')}
            </>
          </ResendText>
        )}
      </WhiteContainerStyled>
      <NextButtonPortal
        onPress={() => {
          loadingOverlay.show()
          void pipe(
            E.tryCatch(
              () => crypto.PrivateKey.generate(),
              (e) => {
                reportError(
                  'error',
                  '‼️ Error while generating private key',
                  e as any
                )
                return t('common.cryptoError')
              }
            ),
            TE.fromEither,
            TE.bindTo('privateKey'),
            TE.bind('verifyPhoneNumberResponse', ({privateKey}) =>
              verifyPhoneNumber({
                code: userCode,
                id: initPhoneVerificationResponse.verificationId,
                userPublicKey: privateKey.exportPublicKey(),
              })
            ),
            TE.match(
              (t) => {
                loadingOverlay.hide()
                Alert.alert(t)
              },
              ({privateKey, verifyPhoneNumberResponse}) => {
                loadingOverlay.hide()
                navigation.navigate('SuccessLogin', {
                  verifyPhoneNumberResponse,
                  privateKey: serializePrivateKey(privateKey),
                  realUserData,
                  anonymizedUserData,
                  phoneNumber,
                })
              }
            )
          )()
        }}
        text={t('common.continue')}
        disabled={userCode.length !== 6}
      />
    </>
  )
}

export default VerificationCodeScreen
