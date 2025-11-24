import * as crypto from '@vexl-next/cryptography'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useState} from 'react'
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
import {verifyPhoneNumberAtom} from '../../api/verifyPhoneNumberAtom'
import Countdown from './components/Countdown'

type Props = LoginStackScreenProps<'VerificationCode'>

function VerificationCodeScreen({
  navigation,
  route: {
    params: {phoneNumber, initPhoneVerificationResponse},
  },
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const [userCode, setUserCode] = useState('')
  const [countdownFinished, setCountdownFinished] = useState(false)
  const verifyPhoneNumber = useSetAtom(verifyPhoneNumberAtom)
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
            testID="@verificationCodeScreen/verificationCodeInput"
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
          void Effect.runFork(
            Effect.gen(function* (_) {
              const privateKey = crypto.KeyHolder.generatePrivateKey()
              const verifyPhoneNumberResponse = yield* _(
                verifyPhoneNumber({
                  code: userCode,
                  id: initPhoneVerificationResponse.verificationId,
                  userPublicKey: privateKey.publicKeyPemBase64,
                })
              )

              return {privateKey, verifyPhoneNumberResponse}
            }).pipe(
              Effect.match({
                onFailure: (t) => {
                  loadingOverlay.hide()
                  Alert.alert(t)
                },
                onSuccess: ({privateKey, verifyPhoneNumberResponse}) => {
                  loadingOverlay.hide()
                  navigation.navigate('SuccessLogin', {
                    verifyPhoneNumberResponse,
                    privateKey,
                    phoneNumber,
                  })
                },
              })
            )
          )
        }}
        text={t('common.continue')}
        disabled={userCode.length !== 6}
      />
    </>
  )
}

export default VerificationCodeScreen
