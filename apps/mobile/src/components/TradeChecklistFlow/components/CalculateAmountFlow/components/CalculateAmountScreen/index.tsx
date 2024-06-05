import {ScopeProvider} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {TradeCalculatorScope} from '../../../../../TradeCalculator/atoms'
import {
  setTradeCalculatorStateActionAtom,
  tradeCalculatorStateAtom,
} from '../../atoms'
import CalculateAmount from './components/CalculateAmount'

type Props = TradeChecklistStackScreenProps<'CalculateAmount'>

function CalculateAmountScreen(props: Props): JSX.Element {
  const {
    route: {
      params: {amountData},
    },
  } = props
  const setTradeCalculatorState = useSetAtom(setTradeCalculatorStateActionAtom)

  useEffect(() => {
    setTradeCalculatorState(amountData)
  }, [amountData, setTradeCalculatorState])

  return (
    <ScopeProvider
      scope={TradeCalculatorScope}
      value={tradeCalculatorStateAtom}
    >
      <CalculateAmount {...props} />
    </ScopeProvider>
  )
}

export default CalculateAmountScreen
