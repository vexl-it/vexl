import {
  type VerifyPhoneNumberRequest,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import * as TE from 'fp-ts/TaskEither'
import {type TaskEither} from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useUserPublicApi} from '../../../api'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

export function useVerifyPhoneNumber(): (
  r: VerifyPhoneNumberRequest
) => TaskEither<string, VerifyPhoneNumberResponse> {
  const publicUser = useUserPublicApi()
  const {t} = useTranslation()

  return (r) =>
    pipe(
      publicUser.verifyPhoneNumber(r),
      TE.mapLeft((l) => {
        switch (l._tag) {
          case 'VerificationNotFound':
            return t('loginFlow.verificationCode.errors.verificationNotFound')
          case 'UserAlreadyExists':
            return t('loginFlow.verificationCode.errors.userAlreadyExists')
          case 'ChallengeCouldNotBeGenerated':
            return t(
              'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
            )
          case 'UnexpectedApiResponseError':
            reportError(
              'error',
              'Unexpected api response while verifying phone number',
              l
            )
            return t('common.unexpectedServerResponse')
          case 'NetworkError':
            return toCommonErrorMessage(l, t) ?? t('common.unknownError')
          case 'UnknownError':
          case 'BadStatusCodeError':
            reportError(
              'error',
              'Unexpected error while verifying phone number',
              l
            )
            return t('common.unknownError')
        }
      })
    )
}
