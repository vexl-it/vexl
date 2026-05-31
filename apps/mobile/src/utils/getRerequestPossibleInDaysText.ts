import {type TFunction} from './localization/I18nProvider'
import {formatInteger} from './localization/formatting'

export default function getRerequestPossibleInDaysText(
  rerequestPossibleInDays: number | undefined,
  t: TFunction,
  locale?: string
): string | null {
  if (rerequestPossibleInDays === 1) return t('offer.rerequestTomorrow')
  if ((rerequestPossibleInDays ?? 0) > 1)
    return t('offer.rerequestDays', {
      days: formatInteger(rerequestPossibleInDays ?? 0, locale),
    })
  return null
}
