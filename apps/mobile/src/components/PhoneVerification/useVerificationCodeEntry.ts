import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type InitPhoneVerificationResponse,
  type PhoneNumberVerificationId,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect, Either} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback, useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {globalDialogAtom} from '../GlobalDialog'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'
import {useKeepInputFocused} from './useKeepInputFocused'

export const VERIFICATION_CODE_LENGTH = 6

export interface VerificationCodeEntry {
  readonly code: string
  readonly onCodeChange: (code: string) => void
  readonly inputRef: React.RefObject<TextInput | null>
  readonly errorMessage: string | undefined
  readonly canSubmit: boolean
  readonly submit: () => void
  readonly inputEditable: boolean
  readonly verification: InitPhoneVerificationResponse
  readonly canResend: boolean
  readonly onResendCountdownFinished: () => void
  readonly resend: () => void
  readonly resendInProgress: boolean
  readonly internationalPhoneNumber: string
  readonly confirmPhoneNumber: () => void
}

/**
 * State of a verification code screen: submits the code once it is complete,
 * lets the user resend it after the previous one expires and confirm the
 * number it was sent to.
 */
export function useVerificationCodeEntry<A>({
  phoneNumber,
  initPhoneVerificationResponse,
  resendCode,
  submitCode,
  onCodeAccepted,
}: {
  readonly phoneNumber: E164PhoneNumber
  readonly initPhoneVerificationResponse: InitPhoneVerificationResponse
  readonly resendCode: (
    phoneNumber: E164PhoneNumber
  ) => Effect.Effect<InitPhoneVerificationResponse, string>
  readonly submitCode: (args: {
    readonly code: string
    readonly verificationId: PhoneNumberVerificationId
  }) => Effect.Effect<A, string>
  // Runs after the loading overlay is gone
  readonly onCodeAccepted?: (result: A) => void
}): VerificationCodeEntry {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const showGlobalDialog = useSetAtom(globalDialogAtom)
  const loadingOverlay = useShowLoadingOverlay()
  const inputRef = useRef<TextInput>(null)
  const submitInProgressRef = useRef(false)
  const resendInProgressRef = useRef(false)
  const [verification, setVerification] = useState(
    initPhoneVerificationResponse
  )
  const [code, setCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [submitInProgress, setSubmitInProgress] = useState(false)
  const [resendInProgress, setResendInProgress] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const parsedPhoneNumber = parsePhoneNumber(phoneNumber).number
  const internationalPhoneNumber =
    parsedPhoneNumber?.international ?? phoneNumber

  useKeepInputFocused(
    inputRef,
    useCallback(
      () => submitInProgressRef.current || resendInProgressRef.current,
      []
    )
  )

  const confirmPhoneNumber = useCallback(() => {
    void Effect.runPromise(
      showGlobalDialog({
        title: t('loginFlow.v2.verificationCode.phoneNumberDialog.title'),
        subtitle: t(
          'loginFlow.v2.verificationCode.phoneNumberDialog.description',
          {phoneNumber: parsedPhoneNumber?.national ?? internationalPhoneNumber}
        ),
        negativeButtonText: t('common.change'),
        positiveButtonText: t(
          'loginFlow.v2.verificationCode.phoneNumberDialog.looksGood'
        ),
        disableClose: true,
      })
    ).then((confirmed) => {
      if (!confirmed) safeGoBack()
    })
  }, [
    internationalPhoneNumber,
    parsedPhoneNumber?.national,
    safeGoBack,
    showGlobalDialog,
    t,
  ])

  const resend = useCallback((): void => {
    if (resendInProgressRef.current || submitInProgressRef.current) return

    resendInProgressRef.current = true
    setErrorMessage(undefined)
    setResendInProgress(true)
    loadingOverlay.show()
    void Effect.runPromise(
      resendCode(phoneNumber).pipe(
        Effect.match({
          onSuccess: (newVerification) => {
            setVerification(newVerification)
            setCanResend(false)
            setCode('')
          },
          onFailure: setErrorMessage,
        }),
        Effect.ensuring(
          Effect.sync(() => {
            resendInProgressRef.current = false
            setResendInProgress(false)
            loadingOverlay.hide()
          })
        )
      )
    )
  }, [loadingOverlay, phoneNumber, resendCode])

  const submitWhenComplete = useCallback(
    (codeToSubmit: string): void => {
      if (
        codeToSubmit.length !== VERIFICATION_CODE_LENGTH ||
        submitInProgressRef.current ||
        resendInProgressRef.current
      )
        return

      submitInProgressRef.current = true
      setErrorMessage(undefined)
      setSubmitInProgress(true)
      loadingOverlay.show()
      void Effect.runPromise(
        submitCode({
          code: codeToSubmit,
          verificationId: verification.verificationId,
        }).pipe(
          Effect.either,
          Effect.ensuring(
            Effect.sync(() => {
              submitInProgressRef.current = false
              setSubmitInProgress(false)
              loadingOverlay.hide()
            })
          )
        )
      ).then(
        Either.match({
          onLeft: setErrorMessage,
          onRight: (result) => onCodeAccepted?.(result),
        })
      )
    },
    [loadingOverlay, onCodeAccepted, submitCode, verification.verificationId]
  )

  const onResendCountdownFinished = useCallback(() => {
    setCanResend(true)
  }, [])

  const onCodeChange = useCallback(
    (newCode: string) => {
      setErrorMessage(undefined)
      setCode(newCode)
      submitWhenComplete(newCode)
    },
    [submitWhenComplete]
  )

  return {
    code,
    onCodeChange,
    inputRef,
    errorMessage,
    canSubmit:
      code.length === VERIFICATION_CODE_LENGTH &&
      !submitInProgress &&
      !resendInProgress,
    submit: () => {
      submitWhenComplete(code)
    },
    inputEditable: !submitInProgress && !resendInProgress,
    verification,
    canResend,
    onResendCountdownFinished,
    resend,
    resendInProgress,
    internationalPhoneNumber,
    confirmPhoneNumber,
  }
}
