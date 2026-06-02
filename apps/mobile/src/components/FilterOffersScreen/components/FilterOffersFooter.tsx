import {Button, Loader, type IconProps} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {useTheme} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {runAfterTwoAnimationFrames} from '../../../utils/runAfterAnimationFrames'
import {
  draftOffersFilterSnapshotAtom,
  filteredOffersPreviewCountAtom,
  initializeFilteredOffersPreviewCountActionAtom,
  isFilteredOffersPreviewCountPendingAtom,
  recomputeFilteredOffersPreviewCountActionAtom,
  setFilteredOffersPreviewCountPendingActionAtom,
} from '../atom'

const PREVIEW_COUNT_DEBOUNCE_MS = 150

function runAfterPreviewCountDelay(callback: () => void): () => void {
  let cancelAnimationFrames: (() => void) | undefined

  const debounceTimeout = setTimeout(() => {
    cancelAnimationFrames = runAfterTwoAnimationFrames(callback)
  }, PREVIEW_COUNT_DEBOUNCE_MS)

  return () => {
    clearTimeout(debounceTimeout)
    cancelAnimationFrames?.()
  }
}

function useDeferredFilteredOffersPreviewCount(): {
  filteredOffersCount: number | undefined
  isPreviewCountPending: boolean
} {
  const draftOffersFilterSnapshot = useAtomValue(draftOffersFilterSnapshotAtom)
  const filteredOffersCount = useAtomValue(filteredOffersPreviewCountAtom)
  const isPreviewCountPending = useAtomValue(
    isFilteredOffersPreviewCountPendingAtom
  )
  const initializeFilteredOffersPreviewCount = useSetAtom(
    initializeFilteredOffersPreviewCountActionAtom
  )
  const setFilteredOffersPreviewCountPending = useSetAtom(
    setFilteredOffersPreviewCountPendingActionAtom
  )
  const recomputeFilteredOffersPreviewCount = useSetAtom(
    recomputeFilteredOffersPreviewCountActionAtom
  )

  useEffect(() => {
    initializeFilteredOffersPreviewCount()
  }, [initializeFilteredOffersPreviewCount])

  useEffect(() => {
    setFilteredOffersPreviewCountPending(true)

    return runAfterPreviewCountDelay(recomputeFilteredOffersPreviewCount)
  }, [
    draftOffersFilterSnapshot,
    recomputeFilteredOffersPreviewCount,
    setFilteredOffersPreviewCountPending,
  ])

  return {
    filteredOffersCount,
    isPreviewCountPending,
  }
}

function PreviewCountLoader({color}: IconProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <Loader
      size="small"
      color={typeof color === 'string' ? color : theme.black100.get()}
    />
  )
}

const FilterOffersFooter = React.memo(function FilterOffersFooter({
  onPress,
}: {
  readonly onPress: () => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {filteredOffersCount, isPreviewCountPending} =
    useDeferredFilteredOffersPreviewCount()
  const isLoading = isPreviewCountPending || filteredOffersCount === undefined

  return (
    <Button
      variant="primary"
      size="large"
      onPress={onPress}
      icon={isLoading ? PreviewCountLoader : undefined}
    >
      {isLoading
        ? t('marketplace.loadingOffers')
        : t('filterOffers.seeOffersFormatted', {
            localizedString: formatInteger(filteredOffersCount, locale),
          })}
    </Button>
  )
})

export default FilterOffersFooter
