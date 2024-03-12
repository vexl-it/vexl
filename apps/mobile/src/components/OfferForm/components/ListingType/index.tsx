import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {useAtom, type PrimitiveAtom} from 'jotai'
import Tabs from '../../../Tabs'
import useContent from './useContent'

interface Props {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  onTabPress?: () => void
}

function ListingTypeSection({listingTypeAtom, onTabPress}: Props): JSX.Element {
  const content = useContent()
  const [listingType, setListingType] = useAtom(listingTypeAtom)

  return (
    <Tabs
      activeTab={listingType}
      onTabPress={(type) => {
        setListingType(type)
        if (onTabPress) onTabPress()
      }}
      tabs={content}
    />
  )
}

export default ListingTypeSection
