import {useFocusEffect} from '@react-navigation/native'
import {KeyHolder} from '@vexl-next/cryptography'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Keyboard, Platform, TextInput, TouchableOpacity} from 'react-native'
import {getTokens} from 'tamagui'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {globalDialogAtom} from '../../GlobalDialog'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {initPhoneVerificationAtom} from '../api/initPhoneVerificationAtom'
import {verifyPhoneNumberAtom} from '../api/verifyPhoneNumberAtom'
import {finishLoginActionAtom} from '../atoms/finishLoginActionAtom'
import Countdown from './Countdown'
import LoginFlowScreen, {LoginFlowTitle} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'VerificationCode'>
const codeBoxHeight = 48

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
      height={codeBoxHeight}
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
  const resendInProgressRef = useRef(false)
  const [
    currentInitPhoneVerificationResponse,
    setCurrentInitPhoneVerificationResponse,
  ] = useState(initPhoneVerificationResponse)
  const [userCode, setUserCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [submitInProgress, setSubmitInProgress] = useState(false)
  const [resendInProgress, setResendInProgress] = useState(false)
  const [countdownFinished, setCountdownFinished] = useState(false)
  const initPhoneVerification = useSetAtom(initPhoneVerificationAtom)
  const verifyPhoneNumber = useSetAtom(verifyPhoneNumberAtom)
  const finishLogin = useSetAtom(finishLoginActionAtom)
  const showGlobalDialog = useSetAtom(globalDialogAtom)
  const {t} = useTranslation()
  const loadingOverlay = useShowLoadingOverlay()

  const parsedPhoneNumber = useMemo(
    () => parsePhoneNumber(phoneNumber).number,
    [phoneNumber]
  )
  const internationalPhoneNumber =
    parsedPhoneNumber?.international ?? phoneNumber
  const nationalPhoneNumber =
    parsedPhoneNumber?.national ?? internationalPhoneNumber

  const showPhoneNumberConfirmationDialog = useCallback(() => {
    void Effect.runPromise(
      showGlobalDialog({
        title: t('loginFlow.v2.verificationCode.phoneNumberDialog.title'),
        subtitle: t(
          'loginFlow.v2.verificationCode.phoneNumberDialog.description',
          {phoneNumber: nationalPhoneNumber}
        ),
        negativeButtonText: t('common.change'),
        positiveButtonText: t(
          'loginFlow.v2.verificationCode.phoneNumberDialog.looksGood'
        ),
        disableClose: true,
      })
    )
      .then((confirmed) => {
        if (!confirmed) safeGoBack()
      })
      .catch(() => undefined)
  }, [nationalPhoneNumber, safeGoBack, showGlobalDialog, t])

  const resendVerificationCode = useCallback((): void => {
    if (resendInProgressRef.current || submitInProgressRef.current) return

    resendInProgressRef.current = true
    setErrorMessage(undefined)
    setResendInProgress(true)
    loadingOverlay.show()
    void Effect.runPromise(initPhoneVerification(phoneNumber))
      .then((result) => {
        setCurrentInitPhoneVerificationResponse(result)
        setCountdownFinished(false)
        setUserCode('')
      })
      .catch((error: unknown) => {
        setErrorMessage(
          typeof error === 'string' ? error : t('common.somethingWentWrong')
        )
      })
      .finally(() => {
        resendInProgressRef.current = false
        setResendInProgress(false)
        loadingOverlay.hide()
      })
  }, [initPhoneVerification, loadingOverlay, phoneNumber, t])

  const submitVerificationCode = useCallback(
    (code: string): void => {
      if (
        code.length !== 6 ||
        submitInProgressRef.current ||
        resendInProgressRef.current
      )
        return

      submitInProgressRef.current = true
      setErrorMessage(undefined)
      setSubmitInProgress(true)
      loadingOverlay.show()
      void Effect.runPromise(
        Effect.gen(function* (_) {
          const privateKey = KeyHolder.generatePrivateKey()
          const verifyPhoneNumberResponse = yield* _(
            verifyPhoneNumber({
              code,
              id: currentInitPhoneVerificationResponse.verificationId,
              userPublicKey: privateKey.publicKeyPemBase64,
            })
          )

          yield* _(Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate))

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
              setErrorMessage(errorMessage)
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
      currentInitPhoneVerificationResponse.verificationId,
      finishLogin,
      loadingOverlay,
      phoneNumber,
      verifyPhoneNumber,
    ]
  )

  useFocusEffect(
    useCallback(() => {
      let refocusTimeout: ReturnType<typeof setTimeout> | undefined

      const focusInput = (): void => {
        if (submitInProgressRef.current || resendInProgressRef.current) return

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
    <LoginFlowScreen
      action={{
        disabled: userCode.length !== 6 || submitInProgress || resendInProgress,
        label: t('common.continue'),
        onPress: () => {
          submitVerificationCode(userCode)
        },
      }}
      footer={
        countdownFinished ? (
          <TouchableOpacity
            disabled={resendInProgress}
            onPress={resendVerificationCode}
          >
            <Typography
              color="$foregroundSecondary"
              textAlign="center"
              textDecorationLine="underline"
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
              color="$foregroundSecondary"
              countUntil={DateTime.fromISO(
                currentInitPhoneVerificationResponse.expirationAt
              )}
              key={currentInitPhoneVerificationResponse.verificationId}
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
            <Typography
              color="$foregroundSecondary"
              onPress={showPhoneNumberConfirmationDialog}
              pressStyle={{opacity: 0.8}}
              textDecorationLine="underline"
              variant="paragraphSmall"
            >
              {internationalPhoneNumber}
            </Typography>
            .
          </Typography>
        </YStack>
        <TouchableOpacity
          accessibilityLabel={
            __DEV__ ? 'Focus verification code input' : undefined
          }
          activeOpacity={1}
          accessible={__DEV__}
          onLongPress={
            __DEV__
              ? () => {
                  setUserCode('222222')
                  submitVerificationCode('222222')
                }
              : undefined
          }
          onPress={() => {
            inputRef.current?.focus()
          }}
        >
          <YStack>
            <TextInput
              accessibilityLabel={
                __DEV__ ? 'Verification code input' : undefined
              }
              accessible={__DEV__}
              autoComplete={
                Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'
              }
              autoFocus
              caretHidden
              editable={!submitInProgress && !resendInProgress}
              importantForAutofill="yes"
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(value) => {
                const code = value.replace(/\D/g, '').substring(0, 6)
                setErrorMessage(undefined)
                setUserCode(code)
                submitVerificationCode(code)
              }}
              pointerEvents={__DEV__ ? 'auto' : 'none'}
              ref={inputRef}
              style={{
                height: codeBoxHeight,
                opacity: __DEV__ ? 0.01 : 0,
                position: 'absolute',
                width: '100%',
                zIndex: getTokens().zIndex.$5.val,
              }}
              testID={__DEV__ ? 'verification-code-input' : undefined}
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
        {errorMessage != null ? (
          <Typography
            color="$redForeground"
            textAlign="center"
            variant="paragraphSmall"
          >
            {errorMessage}
          </Typography>
        ) : null}
      </YStack>
    </LoginFlowScreen>
  )
}
