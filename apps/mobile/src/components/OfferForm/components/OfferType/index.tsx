import useContent from './useContent'
import Tabs from '../../../Tabs'
import {type PrimitiveAtom, useAtom} from 'jotai'
import {type OfferType} from '@vexl-next/domain/dist/general/offers'

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
