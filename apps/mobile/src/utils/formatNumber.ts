import {i18n} from './localization/I18nProvider'

export default function formatNumber(
  number: number | undefined
): string | undefined {
  return number
    ? new Intl.NumberFormat(i18n.locale ?? 'cs', {}).format(number)
    : undefined
}
