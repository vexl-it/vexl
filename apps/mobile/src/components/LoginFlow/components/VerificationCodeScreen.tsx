import {useFocusEffect} from '@react-navigation/native'
import {KeyHolder} from '@vexl-next/cryptography'
import {type RequestedVerificationChannel} from '@vexl-next/rest-api/src/services/user/contracts'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
const SHOW_CHANNEL_SWITCH_AFTER_MILLIS = 20_000

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
  const [channelSwitchVisible, setChannelSwitchVisible] = useState(false)
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

  const sentVia = currentInitPhoneVerificationResponse.sentVia ?? 'sms'
  const otherChannel = sentVia === 'whatsapp' ? 'sms' : 'whatsapp'

  useEffect(() => {
    setChannelSwitchVisible(false)
    const timeout = setTimeout(() => {
      setChannelSwitchVisible(true)
    }, SHOW_CHANNEL_SWITCH_AFTER_MILLIS)

    return () => {
      clearTimeout(timeout)
    }
  }, [currentInitPhoneVerificationResponse.verificationId])

  const resendVerificationCode = useCallback(
    (channel: RequestedVerificationChannel): void => {
      if (resendInProgressRef.current || submitInProgressRef.current) return

      resendInProgressRef.current = true
      setErrorMessage(undefined)
      setResendInProgress(true)
      loadingOverlay.show()
      void Effect.runPromise(initPhoneVerification({phoneNumber, channel}))
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
    },
    [initPhoneVerification, loadingOverlay, phoneNumber, t]
  )

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
        <YStack gap="$4">
          {channelSwitchVisible ? (
            <TouchableOpacity
              disabled={resendInProgress}
              onPress={() => {
                resendVerificationCode(otherChannel)
              }}
            >
              <Typography
                color="$foregroundSecondary"
                textAlign="center"
                textDecorationLine="underline"
                variant="paragraphSmall"
              >
                {otherChannel === 'whatsapp'
                  ? t('loginFlow.v2.verificationCode.sendViaWhatsapp')
                  : t('loginFlow.v2.verificationCode.sendViaSms')}
              </Typography>
            </TouchableOpacity>
          ) : null}
          {countdownFinished ? (
            <TouchableOpacity
              disabled={resendInProgress}
              onPress={() => {
                resendVerificationCode(sentVia)
              }}
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
          )}
        </YStack>
      }
      scroll
    >
      <YStack flex={1} justifyContent="center" gap="$10">
        <YStack alignItems="center" gap="$4">
          <LoginFlowTitle>
            {t('loginFlow.v2.verificationCode.title')}
          </LoginFlowTitle>
          <Typography color="$foregroundSecondary" variant="paragraphSmall">
            {sentVia === 'whatsapp'
              ? t('loginFlow.v2.verificationCode.textWhatsapp')
              : t('loginFlow.v2.verificationCode.text')}{' '}
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
          {sentVia === 'whatsapp' ? (
            <Typography
              color="$foregroundSecondary"
              textAlign="center"
              variant="paragraphSmall"
            >
              {t('loginFlow.v2.verificationCode.whatsappFallbackHint')}
            </Typography>
          ) : null}
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
              pointerEvents="none"
              ref={inputRef}
              style={{
                height: codeBoxHeight,
                opacity: 0,
                position: 'absolute',
                width: '100%',
                zIndex: getTokens().zIndex.$5.val,
              }}
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
