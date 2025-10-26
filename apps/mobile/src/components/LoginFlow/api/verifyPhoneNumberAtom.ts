import {type VerifyPhoneNumberRequest} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'

export const verifyPhoneNumberAtom = atom(
  null,
  (get, _, inputRequest: VerifyPhoneNumberRequest) => {
    const userApi = get(apiAtom).user
    const {t} = get(translationAtom)

    return userApi.verifyPhoneNumber(inputRequest).pipe(
      Effect.catchAll((e) => {
        if (e._tag === 'VerificationNotFoundError')
          return Effect.fail(
            t('loginFlow.verificationCode.errors.verificationNotFound')
          )

        if (e._tag === 'UnableToVerifySmsCodeError')
          return Effect.fail(t(`loginFlow.verificationCode.errors.${e._tag}`))

        if (e._tag === 'UnableToGenerateChallengeError')
          return Effect.fail(
            t('loginFlow.verificationCode.errors.challengeCouldNotBeGenerated')
          )

        if (e._tag === 'HttpApiDecodeError') {
          reportError(
            'error',
            new Error('Unexpected api response while verifying phone number'),
            {e}
          )
          return Effect.fail(t('common.unexpectedServerResponse'))
        }

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
