import {type TFunction} from './localization/I18nProvider'
import {formatInteger, type FormattingLocale} from './localization/formatting'

export default function getRerequestPossibleInDaysText(
  rerequestPossibleInDays: number | undefined,
  t: TFunction,
  locale: FormattingLocale
): string | null {
  if (rerequestPossibleInDays === 1) return t('offer.rerequestTomorrow')
  if ((rerequestPossibleInDays ?? 0) > 1)
    return t('offer.rerequestDays', {
      days: formatInteger(rerequestPossibleInDays ?? 0, locale),
    })
  return null
}
