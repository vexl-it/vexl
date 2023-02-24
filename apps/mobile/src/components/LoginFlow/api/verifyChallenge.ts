import {
  type VerifyChallengeRequest,
  type VerifyChallengeResponse,
} from '@vexl-next/rest-api/dist/services/user/contracts'
import {type TaskEither} from 'fp-ts/TaskEither'
import {useUserPublicApi} from '../../../api'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import reportError from '../../../utils/reportError'

export function useVerifyChallenge(): (
  r: VerifyChallengeRequest
) => TaskEither<string, VerifyChallengeResponse> {
  const publicUser = useUserPublicApi()
  const {t} = useTranslation()

  return (r) =>
    pipe(
      publicUser.verifyChallenge(r),
      TE.mapLeft((l) => {
        switch (l._tag) {
          case 'VerificationNotFound':
            return t('loginFlow.verificationCode.errors.verificationNotFound')
          case 'UserNotFound':
            return t('loginFlow.verificationCode.errors.userAlreadyExists')
          case 'SignatureCouldNotBeGenerated':
            return t(
              'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
            )
          case 'PublicKeyOrHashInvalid':
            reportError(
              'error',
              'Public key or hash invalid while verifying challenge',
              l
            )
            return t(
              'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
            )
          case 'UnexpectedApiResponseError':
            reportError(
              'error',
              'Unexpected api response while verifying challenge',
              l
            )
            return t('common.unexpectedServerResponse')
          case 'UnknownError':
          case 'BadStatusCodeError':
            reportError('error', 'Bad status code while verifying challenge', l)
            return t('common.unknownError')
        }
      })
    )
}
