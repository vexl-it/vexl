import {type Sort} from '@vexl-next/domain/src/general/offers'
import {Picker, type PickerItem} from '@vexl-next/ui'
import {ArrowsVerticalSort} from '@vexl-next/ui/src/icons'
import {useAtom} from 'jotai'
import React, {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {sortingAtom} from '../atom'

function Sorting(): React.ReactElement {
  const {t} = useTranslation()
  const [sorting, setSorting] = useAtom(sortingAtom)

  const sortingItems: ReadonlyArray<PickerItem<Sort>> = useMemo(
    () => [
      {
        label: t('filterOffers.lowestFeeFirst'),
        value: 'LOWEST_FEE_FIRST',
        icon: ArrowsVerticalSort,
      },
      {
        label: t('filterOffers.highestFee'),
        value: 'HIGHEST_FEE',
        icon: ArrowsVerticalSort,
      },
      {
        label: t('filterOffers.newestOffer'),
        value: 'NEWEST_OFFER',
        icon: ArrowsVerticalSort,
      },
      {
        label: t('filterOffers.oldestOffer'),
        value: 'OLDEST_OFFER',
        icon: ArrowsVerticalSort,
      },
      {
        label: t('filterOffers.lowestAmount'),
        value: 'LOWEST_AMOUNT',
        icon: ArrowsVerticalSort,
      },
      {
        label: t('filterOffers.highestAmount'),
        value: 'HIGHEST_AMOUNT',
        icon: ArrowsVerticalSort,
      },
      {
        label: t('filterOffers.mostConnections'),
        value: 'MOST_CONNECTIONS',
        icon: ArrowsVerticalSort,
      },
    ],
    [t]
  )

  return (
    <Picker<Sort>
      items={sortingItems}
      value={sorting}
      onValueChange={(value) => {
        setSorting(value)
      }}
      placeholder={t('filterOffers.selectSortingMethod')}
    />
  )
}

export default Sorting
