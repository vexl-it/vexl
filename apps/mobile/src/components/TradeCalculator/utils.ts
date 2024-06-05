import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {type DropdownItemProps} from '../Dropdown'

export const fiatCurrenciesDropdownData: Array<
  DropdownItemProps<CurrencyCode>
> = Object.values(CurrencyCode.options).map((currency) => ({
  label: currency,
  value: currency,
}))

export function replaceNonDecimalCharsInInput(input: string): string {
  if (isNaN(Number(input))) {
    return '0'
  }

  return input
}
