import {getCurrentLocale} from './localization/I18nProvider'
import {formatDecimal} from './localization/formatting'

export default function formatNumber(
  number: number | undefined
): string | undefined {
  return number ? formatDecimal(number, getCurrentLocale()) : undefined
}
