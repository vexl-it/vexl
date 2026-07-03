import {InvalidDeepLinkError} from './deepLinks/parseDeepLink'
import {ImagePickerError} from './imagePickers'
import {useTranslation, type TFunction} from './localization/I18nProvider'

export interface SomeError {
  _tag: string
  code?: string | number | undefined
  cause?: unknown
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

  // `@effect/platform`'s fetch client fails with a `RequestError` when the
  // device is offline (transport-level failure, no server response). Map it to
  // the network-error message so offline users get an actionable hint instead
  // of the generic fallback. `ResponseError` (server responded) intentionally
  // keeps the generic fallback below.
  if (error._tag === 'RequestError') {
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
