import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {signLoginChallenge} from '@vexl-next/resources-utils/src/loginChallenge'
import {
  type InitPhoneVerificationResponse,
  type UnableToSendVerificationSmsError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, type Option} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {
  allowLoginAgainAtom,
  updateNumberOfLoginAttemptsActionAtom,
} from '../../../state/numberOfLoginAttemptsMmkvAtom'
import isString from '../../../utils/isString'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {reportIssueDialogAtom} from '../../ReportIssue'

export const initPhoneVerificationAtom = atom(
  null,
  (
    get,
    set,
    phoneNumber: E164PhoneNumber
  ): Effect.Effect<
    Option.Option<InitPhoneVerificationResponse>,
    string,
    never
  > => {
    const {t} = get(translationAtom)
    return Effect.gen(function* (_) {
      const api = get(apiAtom)

      const loginChallenge = yield* _(api.user.generateLoginChallenge())
      const signedChallenge = yield* _(
        signLoginChallenge(loginChallenge.challenge)
      )

      set(updateNumberOfLoginAttemptsActionAtom, phoneNumber)

      if (!get(allowLoginAgainAtom))
        return yield* _(
          Effect.fail({_tag: 'TooManyLoginAttemptsError' as const})
        )

      const toReturn = yield* _(
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

      return toReturn
    })
      .pipe(
        Effect.catchAll((e) => {
          reportError(
            'error',
            new Error('Unexpected error while initializing phone verification'),
            {e}
          )

          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })

          return Effect.fail(e)
        }),
        Effect.catchTags({
          UnsupportedVersionToLoginError: (e) =>
            Effect.fail(
              t('loginFlow.phoneNumber.errors.unsuportedVersion', {
                version: String(e.lowestRequiredVersion),
              })
            ),
          PreviousCodeNotExpiredError: () =>
            Effect.fail(
              t('loginFlow.phoneNumber.errors.previousCodeNotExpired')
            ),
          UnableToSendVerificationSmsError: (e) => {
            const reasonsToReport: Array<
              UnableToSendVerificationSmsError['reason']
            > = ['Other']

            if (reasonsToReport.includes(e.reason)) {
              reportError(
                'warn',
                new Error('Unable to send verification sms'),
                {
                  e,
                }
              )
            }
            return Effect.fail(t('loginFlow.phoneNumber.errors.areYouOnVpn'))
          },
          TooManyLoginAttemptsError: () =>
            Effect.fail(t('loginFlow.phoneNumber.errors.tooManyLoginAttempts')),
        }),
        Effect.catchAll((e) => {
          if (isString(e))
            return Effect.zipRight(
              set(reportIssueDialogAtom, {
                title: t(
                  'loginFlow.phoneNumber.errors.smsProviderEncounteredError'
                ),
                subtitle: e,
              }),
              Effect.fail(e)
            )

          return Effect.fail(t('common.unknownError'))
        })
      )
      .pipe(Effect.option)
  }
)
