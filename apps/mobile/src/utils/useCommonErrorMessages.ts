import {type TFunction, useTranslation} from './localization/I18nProvider'
import {AxiosError} from 'axios'

interface SomeError {
  _tag: string
  code?: string
}

export default function useCommonErrorMessages(
  error?: SomeError
): string | null {
  const {t} = useTranslation()

  return toCommonErrorMessage(error, t)
}

export function toCommonErrorMessage(
  error: SomeError | undefined,
  t: TFunction
): string | null {
  if (!error) return null

  if (error._tag === 'NetworkError') {
    if (error?.code === AxiosError.ERR_NETWORK)
      return t('common.networkErrors.errNetwork')
    if (error?.code === AxiosError.ERR_CANCELED)
      return t('common.networkErrors.errCanceled')
    if (error?.code === AxiosError.ETIMEDOUT)
      return t('common.networkErrors.etimedout')
    if (error?.code === AxiosError.ECONNABORTED)
      return t('common.networkErrors.econnaborted')
  }

  if (error._tag === 'UnexpectedApiResponseError') {
    return t('common.errorCreatingInbox')
  }

  if (error._tag === 'UnknownError') {
    return t('common.unknownError')
  }

  return null
}
