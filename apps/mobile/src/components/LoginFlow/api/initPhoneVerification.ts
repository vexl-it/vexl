import {
  type InitPhoneNumberVerificationRequest,
  type InitPhoneNumberVerificationResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useUserPublicApi} from '../../../api'
import * as TE from 'fp-ts/TaskEither'
import {type TaskEither} from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

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
            reportError(
              'error',
              'Unexpected api response while initializing phone verification',
              l
            )
            return t('common.unexpectedServerResponse')
          case 'NetworkError':
            return toCommonErrorMessage(l, t) ?? t('common.unknownError')
          case 'UnknownError':
          case 'BadStatusCodeError':
            reportError(
              'error',
              'Bad status code error while initializing phone verification',
              l
            )
            return t('common.unknownError')
        }
      })
    )
}
