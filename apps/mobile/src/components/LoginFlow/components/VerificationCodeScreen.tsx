import {useFocusEffect} from '@react-navigation/native'
import {generateMasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {deriveIdentityPrivateKey} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {CodeInput, Typography, YStack} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Keyboard, type TextInput} from 'react-native'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  backupFileToRestoreAtom,
  backupKeyPairAtom,
  isBackupForKeyPair,
} from '../../../state/backup/backupToRestore'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {globalDialogAtom} from '../../GlobalDialog'
import InlineErrorText from '../../InlineErrorText'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {getBackupKeyPairAtom} from '../api/getBackupKeyPairAtom'
import {initPhoneVerificationAtom} from '../api/initPhoneVerificationAtom'
import {verifyPhoneNumberAtom} from '../api/verifyPhoneNumberAtom'
import {finishLoginActionAtom} from '../atoms/finishLoginActionAtom'
import Countdown from './Countdown'
import LoginFlowScreen, {LoginFlowLink, LoginFlowTitle} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'VerificationCode'>
const CODE_LENGTH = 6

export default function VerificationCodeScreen({
  navigation,
  route: {
    params: {phoneNumber, initPhoneVerificationResponse, restore},
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
  const getBackupKeyPair = useSetAtom(getBackupKeyPairAtom)
  const backupFileToRestore = useAtomValue(backupFileToRestoreAtom)
  const setBackupKeyPair = useSetAtom(backupKeyPairAtom)
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

  const login = useCallback(
    (code: string): Effect.Effect<void, string> =>
      Effect.gen(function* (_) {
        const masterSeed = generateMasterSeed()
        const privateKey = yield* _(
          deriveIdentityPrivateKey(masterSeed),
          Effect.mapError(() => t('common.cryptoError'))
        )
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
            masterSeed,
            phoneNumber,
          })
        )
      }),
    [
      currentInitPhoneVerificationResponse.verificationId,
      finishLogin,
      phoneNumber,
      t,
      verifyPhoneNumber,
    ]
  )

  const continueRestore = useCallback(
    (code: string): Effect.Effect<void, string> =>
      Effect.gen(function* (_) {
        const keyPair = yield* _(
          getBackupKeyPair({
            code,
            id: currentInitPhoneVerificationResponse.verificationId,
          })
        )
        setBackupKeyPair(Option.some(keyPair))

        yield* _(Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate))

        navigation.replace(
          Option.exists(backupFileToRestore, (file) =>
            isBackupForKeyPair(file, keyPair)
          )
            ? 'RestorePin'
            : 'RestoreWrongPhoneNumber'
        )
      }),
    [
      backupFileToRestore,
      currentInitPhoneVerificationResponse.verificationId,
      getBackupKeyPair,
      navigation,
      setBackupKeyPair,
    ]
  )

  const submitVerificationCode = useCallback(
    (code: string): void => {
      if (
        code.length !== CODE_LENGTH ||
        submitInProgressRef.current ||
        resendInProgressRef.current
      )
        return

      submitInProgressRef.current = true
      setErrorMessage(undefined)
      setSubmitInProgress(true)
      loadingOverlay.show()
      void Effect.runPromise(
        (restore ? continueRestore(code) : login(code)).pipe(
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
    [continueRestore, loadingOverlay, login, restore]
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
        disabled:
          userCode.length !== CODE_LENGTH ||
          submitInProgress ||
          resendInProgress,
        label: t('common.continue'),
        onPress: () => {
          submitVerificationCode(userCode)
        },
      }}
      footer={
        countdownFinished ? (
          <LoginFlowLink
            disabled={resendInProgress}
            label={t('loginFlow.v2.verificationCode.retry')}
            onPress={resendVerificationCode}
          />
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
        <CodeInput
          editable={!submitInProgress && !resendInProgress}
          inputRef={inputRef}
          maxLength={CODE_LENGTH}
          oneTimeCode
          onChangeText={(code) => {
            setErrorMessage(undefined)
            setUserCode(code)
            submitVerificationCode(code)
          }}
          value={userCode}
        />
        <InlineErrorText>{errorMessage}</InlineErrorText>
      </YStack>
    </LoginFlowScreen>
  )
}
