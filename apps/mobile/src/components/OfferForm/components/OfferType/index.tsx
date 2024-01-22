import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {useAtom, type PrimitiveAtom} from 'jotai'
import Tabs from '../../../Tabs'
import useContent from './useContent'

interface Props {
  offerTypeAtom: PrimitiveAtom<OfferType | undefined>
}

function OfferTypeSection({offerTypeAtom}: Props): JSX.Element {
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

export default OfferTypeSection
