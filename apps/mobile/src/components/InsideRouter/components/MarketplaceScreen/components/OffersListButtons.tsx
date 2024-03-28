import {useAtomValue} from 'jotai'
import {Stack, XStack} from 'tamagui'
import {isFilterActiveAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import FilterButtons from './FilterButtons'

interface Props {
  marketplaceEmpty: boolean
}

function OffersListButtons({marketplaceEmpty}: Props): JSX.Element {
  const filterActive = useAtomValue(isFilterActiveAtom)

  return (
    <XStack mt="$4" mx="$2" jc="space-between" space="$2">
      <Stack f={1}>
        {!marketplaceEmpty || filterActive ? <FilterButtons /> : <Stack />}
      </Stack>
    </XStack>
  )
}

export default OffersListButtons
