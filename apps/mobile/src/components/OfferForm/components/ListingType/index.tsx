import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import Tabs from '../../../Tabs'
import useContent from './useContent'

interface Props {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  updateListingTypeActionAtom: WritableAtom<
    null,
    [listingType: ListingType | undefined],
    void
  >
  onTabPress?: () => void
}

function ListingTypeSection({
  listingTypeAtom,
  updateListingTypeActionAtom,
  onTabPress,
}: Props): JSX.Element {
  const content = useContent()
  const listingType = useAtomValue(listingTypeAtom)
  const updateListingType = useSetAtom(updateListingTypeActionAtom)

  return (
    <Tabs
      activeTab={listingType}
      onTabPress={(type) => {
        updateListingType(type)
        if (onTabPress) onTabPress()
      }}
      tabs={content}
    />
  )
}

export default ListingTypeSection
