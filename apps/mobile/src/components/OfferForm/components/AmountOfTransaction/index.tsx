import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {PriceRangeInput} from '@vexl-next/ui'
import {
  useAtomValue,
  type Atom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import React from 'react'
import {currencies} from '../../../../utils/localization/currency'

interface Props {
  amountTopLimitAtom: WritableAtom<number, [SetStateAction<number>], void>
  amountBottomLimitAtom: WritableAtom<number, [SetStateAction<number>], void>
  currencyAtom: Atom<CurrencyCode | undefined>
  onCurrencyPress?: () => void
}

function AmountOfTransaction({
  amountTopLimitAtom,
  amountBottomLimitAtom,
  currencyAtom,
  onCurrencyPress,
}: Props): React.ReactElement | null {
  const currency = useAtomValue(currencyAtom)

  if (!currency) return null

  const maxLimit = currencies[currency].maxAmount

  return (
    <PriceRangeInput
      minValueAtom={amountBottomLimitAtom}
      maxValueAtom={amountTopLimitAtom}
      currency={currencies[currency].code}
      onCurrencyPress={onCurrencyPress ?? (() => {})}
      maxLimit={maxLimit}
    />
  )
}

export default AmountOfTransaction
