import {atom, type PrimitiveAtom, useAtom, useAtomValue} from 'jotai'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import {type Sort} from '@vexl-next/domain/src/general/offers'
import {type DropdownItemProps, Dropdown} from '../../../Dropdown'
import {useMemo} from 'react'

export interface Props {
  sortingAtom: PrimitiveAtom<Sort | undefined>
}

const dropdownRowsAtom = atom<Array<DropdownItemProps<Sort>>>((get) => {
  const {t} = get(translationAtom)

  return [
    {
      label: t('filterOffers.lowestFeeFirst'),
      value: 'LOWEST_FEE_FIRST',
    },
    {
      label: t('filterOffers.highestFee'),
      value: 'HIGHEST_FEE',
    },
    {
      label: t('filterOffers.newestOffer'),
      value: 'NEWEST_OFFER',
    },
    {
      label: t('filterOffers.oldestOffer'),
      value: 'OLDEST_OFFER',
    },
    {
      label: t('filterOffers.lowestAmount'),
      value: 'LOWEST_AMOUNT',
    },
    {
      label: t('filterOffers.highestAmount'),
      value: 'HIGHEST_AMOUNT',
    },
  ]
})

function Sorting({sortingAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const dropdownRows = useAtomValue(dropdownRowsAtom)
  const [sorting, setSorting] = useAtom(sortingAtom)

  const selectedLabel = useMemo(
    () => dropdownRows.find((row) => row.value === sorting)?.label,
    [dropdownRows, sorting]
  )

  return (
    <Dropdown
      size="large"
      variant="yellow"
      value={{value: sorting, label: selectedLabel ?? ''}}
      data={dropdownRows}
      onChange={(item) => {
        if (item.value) setSorting(item.value)
      }}
      placeholder={t('filterOffers.selectSortingMethod')}
    />
  )
}

export default Sorting
