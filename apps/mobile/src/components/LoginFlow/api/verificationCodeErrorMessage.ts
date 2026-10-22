import {type TFunction} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {
  isTransportRequestError,
  type SomeError,
} from '../../../utils/useCommonErrorMessages'

export const verificationCodeErrorMessage = (
  e: SomeError,
  t: TFunction
): string => {
  switch (e._tag) {
    case 'VerificationNotFoundError':
      return t('loginFlow.verificationCode.errors.verificationNotFound')
    case 'UnableToVerifySmsCodeError':
      return t('loginFlow.verificationCode.errors.UnableToVerifySmsCodeError')
    case 'InvalidVerificationIdError':
    case 'InvalidVerificationError':
      return t('loginFlow.verificationCode.errors.verificationExpired')
    case 'UnableToGenerateChallengeError':
      return t('loginFlow.verificationCode.errors.challengeCouldNotBeGenerated')
  }
  if (isTransportRequestError(e)) return t('common.NetworkError')

  reportError('error', new Error('Unexpected error while verifying sms code'), {
    errorTag: e._tag,
  })
  return e._tag === 'HttpApiDecodeError'
    ? t('common.unexpectedServerResponse')
    : t('common.somethingWentWrong')
}
