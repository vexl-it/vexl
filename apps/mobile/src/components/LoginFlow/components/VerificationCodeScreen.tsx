import {useFocusEffect} from '@react-navigation/native'
import {KeyHolder} from '@vexl-next/cryptography'
import {KeyboardAvoidingView, Typography, XStack, YStack} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  Alert,
  Keyboard,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {verifyPhoneNumberAtom} from '../api/verifyPhoneNumberAtom'
import {finishLoginActionAtom} from '../atoms/finishLoginActionAtom'
import Countdown from './Countdown'
import LoginFlowScreen, {LoginFlowTitle} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'VerificationCode'>

function CodeBox({
  value,
}: {
  readonly value: string | undefined
}): React.ReactElement {
  return (
    <YStack
      alignItems="center"
      borderColor="$backgroundHighlight"
      borderRadius="$3"
      borderWidth={1}
      height={48}
      justifyContent="center"
      width={50}
    >
      <Typography color="$foregroundPrimary" variant="paragraph">
        {value ?? ''}
      </Typography>
    </YStack>
  )
}

export default function VerificationCodeScreen({
  route: {
    params: {phoneNumber, initPhoneVerificationResponse},
  },
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const inputRef = useRef<TextInput>(null)
  const submitInProgressRef = useRef(false)
  const [userCode, setUserCode] = useState('')
  const [submitInProgress, setSubmitInProgress] = useState(false)
  const [countdownFinished, setCountdownFinished] = useState(false)
  const verifyPhoneNumber = useSetAtom(verifyPhoneNumberAtom)
  const finishLogin = useSetAtom(finishLoginActionAtom)
  const {t} = useTranslation()
  const loadingOverlay = useShowLoadingOverlay()

  const parsedPhoneNumber = useMemo(() => {
    return parsePhoneNumber(phoneNumber).number?.international
  }, [phoneNumber])

  const submitVerificationCode = useCallback(
    (code: string): void => {
      if (code.length !== 6 || submitInProgressRef.current) return

      submitInProgressRef.current = true
      setSubmitInProgress(true)
      loadingOverlay.show()
      void Effect.runPromise(
        Effect.gen(function* (_) {
          const privateKey = KeyHolder.generatePrivateKey()
          const verifyPhoneNumberResponse = yield* _(
            verifyPhoneNumber({
              code,
              id: initPhoneVerificationResponse.verificationId,
              userPublicKey: privateKey.publicKeyPemBase64,
            })
          )

          yield* _(
            finishLogin({
              verifyPhoneNumberResponse,
              privateKey,
              phoneNumber,
            })
          )
        }).pipe(
          Effect.catchAll((errorMessage) =>
            Effect.sync(() => {
              Alert.alert(errorMessage)
            })
          )
        )
      ).finally(() => {
        submitInProgressRef.current = false
        setSubmitInProgress(false)
        loadingOverlay.hide()
      })
    },
    [
      finishLogin,
      initPhoneVerificationResponse.verificationId,
      loadingOverlay,
      phoneNumber,
      verifyPhoneNumber,
    ]
  )

  useFocusEffect(
    useCallback(() => {
      let refocusTimeout: ReturnType<typeof setTimeout> | undefined

      const focusInput = (): void => {
        inputRef.current?.focus()
      }

      const scheduleFocus = (): void => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        refocusTimeout = setTimeout(focusInput, 50)
      }

      scheduleFocus()

      const keyboardDidHideSubscription = Keyboard.addListener(
        'keyboardDidHide',
        scheduleFocus
      )

      return () => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        keyboardDidHideSubscription.remove()
      }
    }, [])
  )

  return (
    <KeyboardAvoidingView>
      <LoginFlowScreen
        action={{
          disabled: userCode.length !== 6 || submitInProgress,
          label: t('common.continue'),
          onPress: () => {
            submitVerificationCode(userCode)
          },
        }}
        footer={
          countdownFinished ? (
            <TouchableOpacity onPress={safeGoBack}>
              <Typography
                color="$foregroundSecondary"
                textAlign="center"
                variant="paragraphSmall"
              >
                {t('loginFlow.v2.verificationCode.retry')}
              </Typography>
            </TouchableOpacity>
          ) : (
            <Typography
              color="$foregroundSecondary"
              textAlign="center"
              variant="paragraphSmall"
            >
              {t('loginFlow.v2.verificationCode.retryCountdown')}{' '}
              <Countdown
                col="$foregroundSecondary"
                countUntil={DateTime.fromISO(
                  initPhoneVerificationResponse.expirationAt
                )}
                onFinished={() => {
                  setCountdownFinished(true)
                }}
              />
              {t('common.secondsShort')}
            </Typography>
          )
        }
        scroll
      >
        <YStack flex={1} justifyContent="center" gap="$10">
          <YStack alignItems="center" gap="$4">
            <LoginFlowTitle>
              {t('loginFlow.v2.verificationCode.title')}
            </LoginFlowTitle>
            <Typography color="$foregroundSecondary" variant="paragraphSmall">
              {t('loginFlow.v2.verificationCode.text')}{' '}
              <Typography color="$foregroundSecondary" variant="paragraphSmall">
                {parsedPhoneNumber}
              </Typography>
              .
            </Typography>
          </YStack>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              inputRef.current?.focus()
            }}
          >
            <YStack>
              <TextInput
                autoComplete={
                  Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'
                }
                autoFocus
                caretHidden
                importantForAutofill="yes"
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(value) => {
                  const code = value.replace(/\D/g, '').substring(0, 6)
                  setUserCode(code)
                  submitVerificationCode(code)
                }}
                ref={inputRef}
                style={{height: 1, opacity: 0, position: 'absolute', width: 1}}
                textContentType="oneTimeCode"
                value={userCode}
              />
              <XStack gap="$2" justifyContent="center">
                <CodeBox value={userCode.charAt(0)} />
                <CodeBox value={userCode.charAt(1)} />
                <CodeBox value={userCode.charAt(2)} />
                <CodeBox value={userCode.charAt(3)} />
                <CodeBox value={userCode.charAt(4)} />
                <CodeBox value={userCode.charAt(5)} />
              </XStack>
            </YStack>
          </TouchableOpacity>
        </YStack>
      </LoginFlowScreen>
    </KeyboardAvoidingView>
  )
}
