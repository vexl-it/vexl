import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {PriceRangeInput} from '@vexl-next/ui'
import {
  useAtomValue,
  type Atom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import React, {useMemo} from 'react'
import {createMaxAmountForCurrencyAtom} from '../../../../state/currentBtcPriceAtoms'
import {currencies} from '../../../../utils/localization/currency'

interface Props {
  amountTopLimitAtom: WritableAtom<number, [SetStateAction<number>], void>
  amountBottomLimitAtom: WritableAtom<number, [SetStateAction<number>], void>
  currencyAtom: Atom<CurrencyCode | undefined>
  onCurrencyPress?: () => void
  maxLabel?: string
}

function AmountOfTransaction({
  amountTopLimitAtom,
  amountBottomLimitAtom,
  currencyAtom,
  onCurrencyPress,
  maxLabel,
}: Props): React.ReactElement | null {
  const currency = useAtomValue(currencyAtom)
  const maxAmountAtom = useMemo(
    () => createMaxAmountForCurrencyAtom(currencyAtom),
    [currencyAtom]
  )
  const maxLimit = useAtomValue(maxAmountAtom)

  if (!currency) return null

  return (
    <PriceRangeInput
      minValueAtom={amountBottomLimitAtom}
      maxValueAtom={amountTopLimitAtom}
      currency={currencies[currency].code}
      onCurrencyPress={onCurrencyPress ?? (() => {})}
      maxLimit={maxLimit}
      maxLabel={maxLabel}
    />
  )
}

export default AmountOfTransaction
