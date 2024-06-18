import {useNavigationState} from '@react-navigation/native'
import {CurrencyCode} from '../../../../../packages/domain/src/general/currency.brand'
import {type DropdownItemProps} from '../Dropdown'

export const MINIMUM_AVAILABLE_DAYS_THRESHOLD = 1

export function replaceNonDecimalCharsInInput(input: string): string {
  if (isNaN(Number(input))) {
    return '0'
  }

  return input
}

function openFromAgreeOnTradeDetailsScreenSelector(
  routes: Parameters<Parameters<typeof useNavigationState>[0]>[0]
): boolean {
  const agreeOnTradeDetailsIndex = routes.routes.findIndex(
    (one) => one.name === 'AgreeOnTradeDetails'
  )

  if (agreeOnTradeDetailsIndex === -1) return false
  return agreeOnTradeDetailsIndex <= routes.index
}

export function useWasOpenFromAgreeOnTradeDetailsScreen(): boolean {
  return useNavigationState(openFromAgreeOnTradeDetailsScreenSelector)
}

export const fiatCurrenciesDropdownData: Array<
  DropdownItemProps<CurrencyCode>
> = Object.values(CurrencyCode.options).map((currency) => ({
  label: currency,
  value: currency,
}))
