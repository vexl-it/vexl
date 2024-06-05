import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import {ScopeProvider} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import TradeCalculator from '../../../../../../TradeCalculator'
import {
  TradeCalculatorScope,
  type TradeCalculatorState,
} from '../../../../../../TradeCalculator/atoms'
import {
  setTradeCalculatorStateActionAtom,
  tradeCalculatorStateAtom,
} from '../../../atoms'

interface Props {
  amountData?: AmountData | undefined
  onTradeCalculatorSavePress?: (
    tradeCalculatorState: TradeCalculatorState
  ) => void
}

function TradeCalculatorWithProvider({amountData}: Props): JSX.Element {
  const setTradeCalculatorState = useSetAtom(setTradeCalculatorStateActionAtom)

  useEffect(() => {
    setTradeCalculatorState(amountData)
  }, [amountData, setTradeCalculatorState])

  return (
    <ScopeProvider
      scope={TradeCalculatorScope}
      value={tradeCalculatorStateAtom}
    >
      <TradeCalculator />
    </ScopeProvider>
  )
}

export default TradeCalculatorWithProvider

// <Info
// hideCloseButton
// variant="yellow"
// text={`${t(
//   'tradeChecklist.calculateAmount.choseToCalculateWithCustomPrice',
//   {
//     username: otherSideData.userName,
//     percentage: btcPricePercentageDifference,
//   }
// )} ${
//   btcPricePercentageDifference >= 0
//     ? t('vexlbot.higherThanLivePrice')
//     : t('vexlbot.lowerThanLivePrice')
// }`}
// />
