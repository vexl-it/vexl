import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type InitPhoneVerificationResponse,
  type PhoneNumberVerificationId,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Array, Effect, Option} from 'effect'
import {atom} from 'jotai'
import {
  addVerifiedPhoneNumberActionAtom,
  startPhoneNumberVerificationActionAtom,
  verifyPhoneNumberToAddActionAtom,
  type VerifiedPhoneNumber,
} from '../../state/phoneNumbers/addPhoneNumberActionAtoms'
import {removePhoneNumberActionAtom} from '../../state/phoneNumbers/removePhoneNumberActionAtom'
import {userPhoneNumbersAtom} from '../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../utils/getInternationalPhoneNumber'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import {
  isTransportRequestError,
  toCommonErrorMessage,
  type SomeError,
} from '../../utils/useCommonErrorMessages'
import {globalDialogAtom} from '../GlobalDialog'
import {withLoadingOverlayAtom} from '../LoadingOverlayProvider'

const errorMessageActionAtom = atom(
  null,
  (get, _set, {error, context}: {error: SomeError; context: string}) => {
    const {t} = get(translationAtom)
    if (error._tag === 'PhoneNumberAlreadyInAccountError')
      return t('editProfileScreen.addPhoneNumber.errors.alreadyInAccount')

    if (!isTransportRequestError(error))
      reportError('error', new Error(context), {e: error})
    return toCommonErrorMessage(error, t) ?? t('common.somethingWentWrong')
  }
)

export const sendCodeToPhoneNumberToAddActionAtom = atom(
  null,
  (
    _get,
    set,
    phoneNumber: E164PhoneNumber
  ): Effect.Effect<InitPhoneVerificationResponse, string> =>
    set(startPhoneNumberVerificationActionAtom, phoneNumber).pipe(
      Effect.catchTag('SendVerificationSmsError', (e) =>
        Effect.fail(e.message)
      ),
      Effect.mapError((error) =>
        typeof error === 'string'
          ? error
          : set(errorMessageActionAtom, {
              error,
              context: 'Error sending code to phone number to add',
            })
      )
    )
)

export const verifyPhoneNumberToAddWithMessagesActionAtom = atom(
  null,
  (
    _get,
    set,
    args: {
      readonly phoneNumber: E164PhoneNumber
      readonly verificationId: PhoneNumberVerificationId
      readonly code: string
    }
  ): Effect.Effect<VerifiedPhoneNumber, string> =>
    set(verifyPhoneNumberToAddActionAtom, args).pipe(
      Effect.catchTag('VerificationCodeError', (e) => Effect.fail(e.message)),
      Effect.mapError((error) =>
        typeof error === 'string'
          ? error
          : set(errorMessageActionAtom, {
              error,
              context: 'Error verifying phone number to add',
            })
      )
    )
)

const showErrorDialogActionAtom = atom(
  null,
  (get, set, message: string): Effect.Effect<void> => {
    const {t} = get(translationAtom)
    return set(globalDialogAtom, {
      title: t('common.somethingWentWrong'),
      subtitle: message,
      positiveButtonText: t('common.close'),
    })
  }
)

export const removePhoneNumberWithUiFeedbackActionAtom = atom(
  null,
  (get, set, phoneNumber: E164PhoneNumber): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)
      const [mainPhoneNumber, ...extraPhoneNumbers] = get(userPhoneNumbersAtom)
      const nextMainPhoneNumber = Array.head(extraPhoneNumbers)
      const formattedPhoneNumber = getInternationalPhoneNumber(phoneNumber)

      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('editProfileScreen.phoneNumbers.remove.title', {
            phoneNumber: formattedPhoneNumber,
          }),
          subtitle:
            phoneNumber === mainPhoneNumber &&
            Option.isSome(nextMainPhoneNumber)
              ? t('editProfileScreen.phoneNumbers.remove.textMain', {
                  nextPhoneNumber: getInternationalPhoneNumber(
                    nextMainPhoneNumber.value
                  ),
                })
              : t('editProfileScreen.phoneNumbers.remove.text'),
          positiveButtonText: t('editProfileScreen.phoneNumbers.remove.button'),
          positiveButtonVariant: 'destructive',
          negativeButtonText: t('common.cancel'),
        })
      )
      if (!confirmed) return

      yield* _(
        set(removePhoneNumberActionAtom, phoneNumber),
        set(withLoadingOverlayAtom),
        Effect.catchAll((error) =>
          set(
            showErrorDialogActionAtom,
            set(errorMessageActionAtom, {
              error,
              context: 'Error removing phone number',
            })
          )
        )
      )
    })
)

/**
 * Warns before taking the number over from another Vexl account, then adds
 * it. Resolves once the flow is over, whether the number was added or not.
 */
export const addVerifiedPhoneNumberWithUiFeedbackActionAtom = atom(
  null,
  (get, set, verified: VerifiedPhoneNumber): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)

      if (verified.hasExistingVexlAccount) {
        const confirmed = yield* _(
          set(globalDialogAtom, {
            title: t('editProfileScreen.addPhoneNumber.existingAccount.title'),
            subtitle: t(
              'editProfileScreen.addPhoneNumber.existingAccount.text'
            ),
            positiveButtonText: t(
              'editProfileScreen.addPhoneNumber.existingAccount.confirm'
            ),
            positiveButtonVariant: 'destructive',
            negativeButtonText: t('common.cancel'),
          })
        )
        if (!confirmed) return
      }

      yield* _(
        set(addVerifiedPhoneNumberActionAtom, verified),
        Effect.catchAll((error) =>
          set(
            showErrorDialogActionAtom,
            set(errorMessageActionAtom, {
              error,
              context: 'Error adding phone number',
            })
          )
        )
      )
    })
)
