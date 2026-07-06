import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {signLoginChallenge} from '@vexl-next/resources-utils/src/loginChallenge'
import {
  InitPhoneVerificationResponse,
  type UnableToSendVerificationSmsError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {
  allowLoginAgainAtom,
  updateNumberOfLoginAttemptsActionAtom,
} from '../../../state/numberOfLoginAttemptsMmkvAtom'
import isString from '../../../utils/isString'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../../GlobalDialog'
import {reportIssueDialogAtom} from '../../ReportIssue'

class TooManyLoginAttemptsError extends Schema.TaggedError<TooManyLoginAttemptsError>(
  'TooManyLoginAttemptsError'
)('TooManyLoginAttemptsError', {}) {}

function initPhoneVerificationResponseFromSmsError(
  error: UnableToSendVerificationSmsError
): InitPhoneVerificationResponse | undefined {
  if (error.verificationId === undefined || error.expirationAt === undefined) {
    return undefined
  }

  return new InitPhoneVerificationResponse({
    verificationId: error.verificationId,
    expirationAt: error.expirationAt,
  })
}

export const initPhoneVerificationAtom = atom(
  null,
  (
    get,
    set,
    phoneNumber: E164PhoneNumber
  ): Effect.Effect<InitPhoneVerificationResponse, string, never> => {
    const {t} = get(translationAtom)
    const failWithSmsProviderErrorDialog = (
      subtitle: string
    ): Effect.Effect<never, string> =>
      Effect.zipRight(
        set(reportIssueDialogAtom, {
          title: t('loginFlow.phoneNumber.errors.smsProviderEncounteredError'),
          subtitle,
        }),
        Effect.fail(subtitle)
      )

    return Effect.gen(function* (_) {
      const api = get(apiAtom)

      const loginChallenge = yield* _(api.user.generateLoginChallenge())
      const signedChallenge = yield* _(
        signLoginChallenge(loginChallenge.challenge)
      )

      set(updateNumberOfLoginAttemptsActionAtom, phoneNumber)

      if (!get(allowLoginAgainAtom))
        return yield* _(Effect.fail(new TooManyLoginAttemptsError()))

      const toReturn = yield* _(
        api.user.initPhoneVerification({
          challenge: {
            challenge: loginChallenge.challenge,
            clientSignature: signedChallenge,
            serverSignature: loginChallenge.serverSignature,
          },
          phoneNumber,
        })
      )

      return toReturn
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
          const verificationResponse =
            initPhoneVerificationResponseFromSmsError(e)

          if (verificationResponse !== undefined) {
            const areYouOnVpnMessage = t(
              'loginFlow.phoneNumber.errors.areYouOnVpn'
            )

            return set(askAreYouSureActionAtom, {
              variant: 'info',
              steps: [
                {
                  type: 'StepWithText',
                  title: t(
                    'loginFlow.phoneNumber.errors.smsProviderEncounteredError'
                  ),
                  description: t(
                    'loginFlow.phoneNumber.errors.continueWithSmsCodeDescription'
                  ),
                  positiveButtonText: t(
                    'loginFlow.phoneNumber.errors.continueWithSmsCode'
                  ),
                  negativeButtonText: t(
                    'loginFlow.phoneNumber.errors.smsCodeNotReceived'
                  ),
                },
              ],
            }).pipe(
              Effect.map(() => verificationResponse),
              Effect.catchAll(() =>
                failWithSmsProviderErrorDialog(areYouOnVpnMessage)
              )
            )
          }

          switch (e.reason) {
            case 'InvalidPhoneNumber':
            case 'NumberDoesNotSupportSms':
            case 'UnsupportedCarrier':
              return Effect.fail(
                t('loginFlow.v2.phoneNumber.errors.doesNotLookRight')
              )
            case 'MaxAttemptsReached':
              return Effect.fail(
                t('loginFlow.phoneNumber.errors.tooManyLoginAttempts')
              )
            case 'AntiFraudBlock':
            case 'AntiFraudBlock12h':
            case 'AntiFraudBlockGeo':
              return Effect.fail(t('loginFlow.phoneNumber.errors.areYouOnVpn'))
            case 'CarrierError':
              reportError(
                'warn',
                new Error('Unable to send verification sms'),
                {
                  e,
                }
              )
              return failWithSmsProviderErrorDialog(
                t('loginFlow.phoneNumber.errors.areYouOnVpn')
              )
            case 'Other':
              reportError(
                'warn',
                new Error('Unable to send verification sms'),
                {
                  e,
                }
              )
              return failWithSmsProviderErrorDialog(
                t('loginFlow.phoneNumber.errors.areYouOnVpn')
              )
          }
        },
        TooManyLoginAttemptsError: () =>
          Effect.fail(t('loginFlow.phoneNumber.errors.tooManyLoginAttempts')),
      }),
      Effect.catchAll((e) => {
        if (isString(e)) return Effect.fail(e)

        // Don't report offline (transport-level RequestError) to Sentry
        if (!(e._tag === 'RequestError' && e.reason === 'Transport')) {
          reportError(
            'error',
            new Error('Unexpected error while initializing phone verification'),
            {e}
          )
        }

        return Effect.fail(
          toCommonErrorMessage(e, t) ??
            t('common.somethingWentWrongDescription')
        )
      })
    )
  }
)
