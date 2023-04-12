import useContent from './useContent'
import Tabs from '../../../Tabs'
import {currencyAtom} from '../../state/atom'
import {useAtom} from 'jotai'

function CurrencyComponent(): JSX.Element {
  const content = useContent()
  const [currency, setCurrency] = useAtom(currencyAtom)

  return (
    <Tabs
      activeTab={currency}
      onTabPress={(currency) => {
        setCurrency(currency)
      }}
      tabs={content}
    />
  )
}

export default CurrencyComponent
