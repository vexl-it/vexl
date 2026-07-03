import {InvalidDeepLinkError} from './deepLinks/parseDeepLink'
import {ImagePickerError} from './imagePickers'
import {useTranslation, type TFunction} from './localization/I18nProvider'

export interface SomeError {
  _tag: string
  code?: string | number | undefined
  cause?: unknown
  // `@effect/platform`'s `RequestError` carries a `reason`
  // ('Transport' | 'Encode' | 'InvalidUrl'). Only 'Transport' is a genuine
  // network/offline failure; 'Encode'/'InvalidUrl' are app-side request bugs.
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

  // `@effect/platform`'s fetch client fails with a `RequestError` when the
  // device is offline (transport-level failure, no server response). Map only
  // the transport reason to the network-error message so offline users get an
  // actionable hint instead of the generic fallback. Other `RequestError`
  // reasons ('Encode'/'InvalidUrl') are app-side bugs and fall through to the
  // generic fallback. `ResponseError` (server responded) does the same.
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
