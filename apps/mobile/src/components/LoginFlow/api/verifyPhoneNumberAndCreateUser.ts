import {type TaskEither} from 'fp-ts/TaskEither'
import {
  type VerifyChallengeRequest,
  type VerifyChallengeResponse,
  type VerifyPhoneNumberRequest,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/dist/services/user/contracts'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {useUserPublicApi} from '../../../api'
import {useTranslation} from '../../../utils/localization/I18nProvider'

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
            // TODO sentry
            return t('common.unexpectedServerResponse')
          case 'UnknownError':
          case 'BadStatusCodeError':
            // TODO sentry
            return t('common.unknownError')
        }
      })
    )
}

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
            // todo sentry
            return t(
              'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
            )
          case 'UnexpectedApiResponseError':
            // TODO sentry
            return t('common.unexpectedServerResponse')
          case 'UnknownError':
          case 'BadStatusCodeError':
            // TODO sentry
            return t('common.unknownError')
        }
      })
    )
}
