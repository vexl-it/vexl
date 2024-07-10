import * as crypto from '@vexl-next/cryptography'
import {parsePhoneNumber} from 'awesome-phonenumber'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {DateTime} from 'luxon'
import {useState} from 'react'
import {Alert, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text} from 'tamagui'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import TextInput from '../../../Input'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {WhiteContainerWithScroll} from '../../../WhiteContainer'
import {useVerifyPhoneNumber} from '../../api/verifyPhoneNumber'
import Countdown from './components/Countdown'

type Props = LoginStackScreenProps<'VerificationCode'>

function VerificationCodeScreen({
  navigation,
  route: {
    params: {phoneNumber, initPhoneVerificationResponse},
  },
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const [userCode, setUserCode] = useState('')
  const [countdownFinished, setCountdownFinished] = useState(false)
  const verifyPhoneNumber = useVerifyPhoneNumber()
  const {t} = useTranslation()
  const loadingOverlay = useShowLoadingOverlay()

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={2} />
      <WhiteContainerWithScroll>
        <Stack mb="$3">
          <Text
            col="$black"
            numberOfLines={2}
            adjustsFontSizeToFit
            flex={1}
            ff="$heading"
            fos={24}
          >
            {t('loginFlow.verificationCode.title')}
          </Text>
        </Stack>
        <Text ff="$body500" fos={14} col="$greyOnWhite">
          {t('loginFlow.verificationCode.text')}{' '}
          <Text ff="$body500" fos={14} col="$grey">
            {parsePhoneNumber(phoneNumber).number?.international}
          </Text>
        </Text>
        <Stack my="$6">
          <TextInput
            testID="verification-code-input"
            keyboardType="number-pad"
            value={userCode}
            onChangeText={(v) => {
              setUserCode(v.substring(0, 6))
            }}
            placeholder={t('loginFlow.verificationCode.inputPlaceholder')}
          />
        </Stack>
        {countdownFinished ? (
          <TouchableWithoutFeedback onPress={safeGoBack}>
            <Text ff="$body500" col="$greyOnWhite" fos={14} ta="center">
              {t('loginFlow.verificationCode.retry')}
            </Text>
          </TouchableWithoutFeedback>
        ) : (
          <Text ff="$body500" col="$greyOnWhite" fos={14} ta="center">
            <>
              {t('loginFlow.verificationCode.retryCountdown')}{' '}
              <Countdown
                col="$greyOnWhite"
                countUntil={DateTime.fromISO(
                  initPhoneVerificationResponse.expirationAt
                )}
                onFinished={() => {
                  setCountdownFinished(true)
                }}
              />
              {t('common.secondsShort')}
            </>
          </Text>
        )}
      </WhiteContainerWithScroll>
      <NextButtonProxy
        onPress={() => {
          loadingOverlay.show()
          void pipe(
            crypto.KeyHolder.generatePrivateKey(),
            TE.right,
            TE.bindTo('privateKey'),
            TE.bind('verifyPhoneNumberResponse', ({privateKey}) =>
              verifyPhoneNumber({
                code: userCode,
                id: initPhoneVerificationResponse.verificationId,
                userPublicKey: privateKey.publicKeyPemBase64,
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
                  privateKey,
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
