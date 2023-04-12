import useContent from './useContent'
import Tabs from '../../../Tabs'
import {useAtom} from 'jotai'
import {offerTypeAtom} from '../../state/atom'

function OfferType(): JSX.Element {
  const content = useContent()
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
