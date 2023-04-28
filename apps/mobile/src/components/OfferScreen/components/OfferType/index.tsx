import useContent from './useContent'
import Tabs from '../../../Tabs'
import {useAtom} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../../atoms/offerFormStateAtoms'

function OfferType(): JSX.Element {
  const content = useContent()
  const {offerTypeAtom} = useMolecule(offerFormStateMolecule)
  const [offerType, setOfferType] = useAtom(offerTypeAtom)

  return (
    <Tabs
      activeTab={offerType}
      onTabPress={(offerType) => {
        setOfferType(offerType)
      }}
      tabs={content}
    />
  )
}

export default OfferType
