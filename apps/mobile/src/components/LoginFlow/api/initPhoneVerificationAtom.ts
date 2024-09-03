import {
  type InitPhoneVerificationResponse,
  type InitVerificationInput,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'

export const initPhoneVerificationAtom = atom(
  null,
  (
    get,
    _,
    inputRequest: InitVerificationInput
  ): Effect.Effect<InitPhoneVerificationResponse, string, never> => {
    const {t} = get(translationAtom)
    const api = get(apiAtom)

    return api.user.initPhoneVerification(inputRequest).pipe(
      Effect.catchTags({
        PreviousCodeNotExpiredError: () =>
          Effect.fail(t('loginFlow.phoneNumber.errors.previousCodeNotExpired')),
        UnableToSendVerificationSmsError: (e) => {
          reportError('error', new Error('Unable to send verification sms'), {
            e,
          })
          return Effect.fail(
            `${t('loginFlow.phoneNumber.errors.unableToSendVerificationSms')}: ${e.reason}`
          )
        },
        UnexpectedApiResponseError: (e) => {
          reportError(
            'error',
            new Error(
              'Unexpected api response while initializing phone verification'
            ),
            {e}
          )
          return Effect.fail(t('common.unexpectedServerResponse'))
        },
      }),
      Effect.catchAll((e) => {
        reportError(
          'error',
          new Error('Unexpected error while initializing phone verification'),
          {e}
        )

        return Effect.fail(t('common.unknownError'))
      })
    )
  }
)
