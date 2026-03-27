import {FilterBar} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {
  marketplaceFilterBarFieldsAtom,
  marketplaceFilterBarSelectedFieldAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {type MarketplaceFilterBarOption} from '../../../../../state/marketplace/domain'

interface Props {
  postSelectActions?: () => void
}

function FilterTagBar({postSelectActions}: Props): React.ReactElement | null {
  const marketplaceFilterBarFields = useAtomValue(
    marketplaceFilterBarFieldsAtom
  )
  const [filterBarSelectedFields, setFilterBarSelectedFields] = useAtom(
    marketplaceFilterBarSelectedFieldAtom
  )

  const handleSelectedValuesChange = useCallback(
    (values: ReadonlySet<MarketplaceFilterBarOption>) => {
      setFilterBarSelectedFields(new Set(values))
      postSelectActions?.()
    },
    [postSelectActions, setFilterBarSelectedFields]
  )

  return (
    <FilterBar
      items={marketplaceFilterBarFields}
      selectedValues={filterBarSelectedFields}
      onSelectedValuesChange={handleSelectedValuesChange}
      containerStyle={{marginLeft: '$5'}}
    />
  )
}

export default FilterTagBar
