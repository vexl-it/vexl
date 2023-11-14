import {getCurrentLocale} from './localization/I18nProvider'

export default function formatNumber(
  number: number | undefined
): string | undefined {
  return number
    ? new Intl.NumberFormat(getCurrentLocale(), {}).format(number)
    : undefined
}
