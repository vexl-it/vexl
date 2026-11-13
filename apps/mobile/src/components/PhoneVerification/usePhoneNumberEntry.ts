import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, Option} from 'effect'
import {useCallback, useRef, useState} from 'react'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../utils/dismissKeyboardPromise'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'
import {type PhoneNumberInputProps} from './PhoneNumberInput'

/**
 * State of a phone number entry screen: sends the verification code for the
 * entered number and hands the result over once the keyboard is gone.
 */
export function usePhoneNumberEntry<A>({
  sendCode,
  onCodeSent,
  openCountryPicker,
}: {
  readonly sendCode: (phoneNumber: E164PhoneNumber) => Effect.Effect<A, string>
  readonly onCodeSent: (phoneNumber: E164PhoneNumber, response: A) => void
  readonly openCountryPicker: () => void
}): {
  readonly canSubmit: boolean
  readonly submit: () => void
  readonly inputProps: PhoneNumberInputProps
} {
  const [phoneNumber, setPhoneNumber] = useState<
    Option.Option<E164PhoneNumber>
  >(Option.none())
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const refocusPausedRef = useRef(false)
  const submitInProgressRef = useRef(false)
  const loadingOverlay = useShowLoadingOverlay()

  const submit = useCallback((): void => {
    if (Option.isNone(phoneNumber) || submitInProgressRef.current) return

    submitInProgressRef.current = true
    setErrorMessage(undefined)
    loadingOverlay.show()
    void Effect.runPromise(
      sendCode(phoneNumber.value).pipe(
        Effect.tap(() =>
          Effect.sync(() => {
            refocusPausedRef.current = true
          })
        ),
        Effect.tap((response) =>
          Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate).pipe(
            Effect.andThen(() => {
              onCodeSent(phoneNumber.value, response)
            })
          )
        ),
        Effect.catchAll((message) =>
          Effect.sync(() => {
            setErrorMessage(message)
          })
        ),
        Effect.ensuring(
          Effect.sync(() => {
            submitInProgressRef.current = false
            loadingOverlay.hide()
          })
        )
      )
    )
  }, [loadingOverlay, onCodeSent, phoneNumber, sendCode])

  const onPhoneNumberChange = useCallback(
    (newPhoneNumber: Option.Option<E164PhoneNumber>) => {
      setErrorMessage(undefined)
      setPhoneNumber(newPhoneNumber)
    },
    []
  )

  const onCountryPickerPress = useCallback(() => {
    setErrorMessage(undefined)
    openCountryPicker()
  }, [openCountryPicker])

  return {
    canSubmit: Option.isSome(phoneNumber),
    submit,
    inputProps: {
      errorMessage,
      onPhoneNumberChange,
      onCountryPickerPress,
      refocusPausedRef,
    },
  }
}
