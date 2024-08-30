import {type VerifyPhoneNumberInput} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {publicApiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'

export const verifyPhoneNumberAtom = atom(
  null,
  (get, _, inputRequest: VerifyPhoneNumberInput) => {
    const userApi = get(publicApiAtom).user
    const {t} = get(translationAtom)

    return userApi.verifyPhoneNumber(inputRequest).pipe(
      Effect.catchTags({
        VerificationNotFoundError: () =>
          Effect.fail(
            t('loginFlow.verificationCode.errors.verificationNotFound')
          ),
        UnableToGenerateChallengeError: () =>
          Effect.fail(
            t('loginFlow.verificationCode.errors.challengeCouldNotBeGenerated')
          ),
        UnexpectedApiResponseErrorE: (e) => {
          reportError(
            'error',
            new Error('Unexpected api response while verifying phone number'),
            {e}
          )
          return Effect.fail(t('common.unexpectedServerResponse'))
        },
      }),
      Effect.catchAll((e) => {
        reportError(
          'error',
          new Error('Unexpected error while verifying phone number'),
          {e}
        )

        return Effect.fail(t('common.unknownError'))
      })
    )
  }
)
