import {InvalidDeepLinkError} from './deepLinks/parseDeepLink'
import {ImagePickerError} from './imagePickers'
import {useTranslation, type TFunction} from './localization/I18nProvider'

export interface SomeError {
  _tag: string
  code?: string | number | undefined
  cause?: unknown
  reason?: unknown
}

export default function useCommonErrorMessages(
  error?: SomeError
): string | null {
  const {t} = useTranslation()

  return toCommonErrorMessage(error, t)
}

export function toCommonErrorMessage(
  error: SomeError | undefined,
  t: TFunction,
  fallbackToNull?: boolean
): string | null {
  if (!error) return null

  // Only transport-level RequestError means the device is offline. Other
  // reasons ('Encode'/'InvalidUrl') are app-side bugs and fall through to the
  // generic fallback, as does ResponseError (server responded).
  if (error._tag === 'RequestError' && error.reason === 'Transport') {
    return t('common.NetworkError')
  }

  if (
    error._tag === 'NetworkError' ||
    error._tag === 'NotFoundError' ||
    error._tag === 'UnauthorizedError' ||
    error._tag === 'UnexpectedApiResponseError' ||
    error._tag === 'UnknownClientError' ||
    error._tag === 'UnexpectedServerError' ||
    error._tag === InvalidDeepLinkError._tag ||
    error._tag === ImagePickerError._tag
  ) {
    return t(`common.${error._tag}`)
  }

  return fallbackToNull ? null : t('common.somethingWentWrongDescription')
}
