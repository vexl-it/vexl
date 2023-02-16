import {
  type InitPhoneNumberVerificationRequest,
  type InitPhoneNumberVerificationResponse,
} from '@vexl-next/rest-api/dist/services/user/contracts'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useUserPublicApi} from '../../../api'
import * as TE from 'fp-ts/TaskEither'
import {type TaskEither} from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'

export function useInitPhoneVerification(): (
  request: InitPhoneNumberVerificationRequest
) => TaskEither<string, InitPhoneNumberVerificationResponse> {
  const {t} = useTranslation()
  const publicUser = useUserPublicApi()

  return (request: InitPhoneNumberVerificationRequest) =>
    pipe(
      publicUser.initPhoneVerification(request),
      TE.mapLeft((l) => {
        switch (l._tag) {
          case 'InvalidPhoneNumber':
            return t('loginFlow.phoneNumber.errors.invalidPhoneNumber')
          case 'PreviousCodeNotExpired':
            return t('loginFlow.phoneNumber.errors.previousCodeNotExpired')
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
