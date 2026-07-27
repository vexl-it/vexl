import {FilterBar} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {
  marketplaceFilterBarFieldsAtom,
  marketplaceFilterBarSelectedFieldAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {type MarketplaceFilterBarOption} from '../../../../../state/marketplace/domain'
import {runAfterAnimationFrame} from '../../../../../utils/runAfterAnimationFrames'

interface Props {
  readonly onSelectStart?: () => void
  readonly postSelectActions?: () => void
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
  const [displayedSelectedFields, setDisplayedSelectedFields] = useState(
    filterBarSelectedFields
  )
  const cancelPendingSelectionFrameRef = useRef<(() => void) | undefined>(
    undefined
  )

  const clearPendingSelectionFrame = useCallback(() => {
    cancelPendingSelectionFrameRef.current?.()
    cancelPendingSelectionFrameRef.current = undefined
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
      setDisplayedSelectedFields(new Set(values))

      if (!onSelectStart) {
        commitSelectedValues(values)
        return
      }

      onSelectStart()
      clearPendingSelectionFrame()
      cancelPendingSelectionFrameRef.current = runAfterAnimationFrame(() => {
        cancelPendingSelectionFrameRef.current = undefined
        commitSelectedValues(values)
      })
    },
    [clearPendingSelectionFrame, commitSelectedValues, onSelectStart]
  )

  useEffect(() => {
    return clearPendingSelectionFrame
  }, [clearPendingSelectionFrame])

  useEffect(() => {
    if (cancelPendingSelectionFrameRef.current !== undefined) return

    setDisplayedSelectedFields(filterBarSelectedFields)
  }, [filterBarSelectedFields])

  return (
    <FilterBar
      items={marketplaceFilterBarFields}
      selectedValues={displayedSelectedFields}
      onSelectedValuesChange={handleSelectedValuesChange}
      containerStyle={{marginLeft: '$5'}}
    />
  )
}

export default FilterTagBar
