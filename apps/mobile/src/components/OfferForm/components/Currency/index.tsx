import useContent from './useContent'
import Tabs from '../../../Tabs'
import {
  type PrimitiveAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'

interface Props {
  currencyAtom: PrimitiveAtom<CurrencyCode>
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode
      }
    ],
    boolean
  >
}

function CurrencyComponent({
  currencyAtom,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element {
  const content = useContent()
  const currency = useAtomValue(currencyAtom)
  const updateCurrencyLimits = useSetAtom(updateCurrencyLimitsAtom)

  return (
    <Tabs
      activeTab={currency}
      onTabPress={(currency) => {
        updateCurrencyLimits({
          currency,
        })
      }}
      tabs={content}
    />
  )
}

export default CurrencyComponent
