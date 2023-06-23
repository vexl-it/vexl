import {type TFunction} from './localization/I18nProvider'

export default function getRerequestPossibleInDaysText(
  rerequestPossibleInDays: number | undefined,
  t: TFunction
): string | null {
  if (rerequestPossibleInDays === 1) return t('offer.rerequestTomorrow')
  if ((rerequestPossibleInDays ?? 0) > 1)
    return t('offer.rerequestDays', {days: rerequestPossibleInDays})
  return null
}
