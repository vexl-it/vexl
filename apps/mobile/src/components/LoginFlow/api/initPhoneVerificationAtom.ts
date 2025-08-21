import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {signLoginChallenge} from '@vexl-next/resources-utils/src/loginChallenge'
import {type InitPhoneVerificationResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import {isString} from 'effect/Predicate'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'

export const initPhoneVerificationAtom = atom(
  null,
  (
    get,
    _,
    phoneNumber: E164PhoneNumber
  ): Effect.Effect<InitPhoneVerificationResponse, string, never> => {
    const {t} = get(translationAtom)
    return Effect.gen(function* (_) {
      const api = get(apiAtom)

      const loginChallenge = yield* _(api.user.generateLoginChallenge())
      const signedChallenge = yield* _(
        signLoginChallenge(loginChallenge.challenge)
      )

      return yield* _(
        api.user.initPhoneVerification({
          body: {
            challenge: {
              challenge: loginChallenge.challenge,
              clientSignature: signedChallenge,
              serverSignature: loginChallenge.serverSignature,
            },
            phoneNumber,
          },
        })
      )
    }).pipe(
      Effect.catchTags({
        UnsupportedVersionToLoginError: (e) =>
          Effect.fail(
            t('loginFlow.phoneNumber.errors.unsuportedVersion', {
              version: String(e.lowestRequiredVersion),
            })
          ),
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

        if (isString(e)) return Effect.fail(e)

        return Effect.fail(t('common.unknownError'))
      })
    )
  }
)
