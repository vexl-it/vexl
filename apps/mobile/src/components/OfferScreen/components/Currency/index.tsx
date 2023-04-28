import useContent from './useContent'
import Tabs from '../../../Tabs'
import {useAtom} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../../atoms/offerFormStateAtoms'

function CurrencyComponent(): JSX.Element {
  const content = useContent()
  const {currencyAtom} = useMolecule(offerFormStateMolecule)
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
