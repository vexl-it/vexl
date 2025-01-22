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
  t: TFunction
): string | null {
  if (!error) return null

  if (
    error._tag === 'NetworkError' ||
    error._tag === 'NotFoundError' ||
    error._tag === 'UnauthorizedError' ||
    error._tag === 'UnexpectedApiResponseError' ||
    error._tag === 'UnknownClientError' ||
    error._tag === 'UnknownServerError'
  ) {
    return t(`common.${error._tag}`)
  }

  return t('common.unknownError')
}
