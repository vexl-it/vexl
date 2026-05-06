import {FilterBar} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useRef} from 'react'
import {
  marketplaceFilterBarFieldsAtom,
  marketplaceFilterBarSelectedFieldAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {type MarketplaceFilterBarOption} from '../../../../../state/marketplace/domain'

interface Props {
  onSelectStart?: () => void
  postSelectActions?: () => void
}

function FilterTagBar({
  onSelectStart,
  postSelectActions,
}: Props): React.ReactElement | null {
  const marketplaceFilterBarFields = useAtomValue(
    marketplaceFilterBarFieldsAtom
  )
  const [filterBarSelectedFields, setFilterBarSelectedFields] = useAtom(
    marketplaceFilterBarSelectedFieldAtom
  )
  const pendingSelectionFrameRef = useRef<number | null>(null)

  const clearPendingSelectionFrame = useCallback(() => {
    if (pendingSelectionFrameRef.current === null) return

    cancelAnimationFrame(pendingSelectionFrameRef.current)
    pendingSelectionFrameRef.current = null
  }, [])

  const commitSelectedValues = useCallback(
    (values: ReadonlySet<MarketplaceFilterBarOption>) => {
      setFilterBarSelectedFields(new Set(values))
      postSelectActions?.()
    },
    [postSelectActions, setFilterBarSelectedFields]
  )

  const handleSelectedValuesChange = useCallback(
    (values: ReadonlySet<MarketplaceFilterBarOption>) => {
      if (!onSelectStart) {
        commitSelectedValues(values)
        return
      }

      onSelectStart()
      clearPendingSelectionFrame()
      pendingSelectionFrameRef.current = requestAnimationFrame(() => {
        pendingSelectionFrameRef.current = null
        commitSelectedValues(values)
      })
    },
    [clearPendingSelectionFrame, commitSelectedValues, onSelectStart]
  )

  useEffect(() => clearPendingSelectionFrame, [clearPendingSelectionFrame])

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
