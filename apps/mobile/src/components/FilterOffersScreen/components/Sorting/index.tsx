import {type Atom, atom, useAtom, useAtomValue} from 'jotai'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import Dropdown, {type RowProps} from '../../../Dropdown'
import {type Sort} from '@vexl-next/domain/dist/general/offers'

export interface Props {
  sortingAtom: Atom<Sort | undefined>
}

const dropdownRowsAtom = atom<Array<RowProps<Sort>>>((get) => {
  const {t} = get(translationAtom)

  return [
    {
      title: t('filterOffers.lowestFeeFirst'),
      type: 'LOWEST_FEE_FIRST',
    },
    {
      title: t('filterOffers.highestFee'),
      type: 'HIGHEST_FEE',
    },
    {
      title: t('filterOffers.newestOffer'),
      type: 'NEWEST_OFFER',
    },
    {
      title: t('filterOffers.oldestOffer'),
      type: 'OLDEST_OFFER',
    },
    {
      title: t('filterOffers.lowestAmount'),
      type: 'LOWEST_AMOUNT',
    },
    {
      title: t('filterOffers.highestAmount'),
      type: 'HIGHEST_AMOUNT',
    },
  ]
})

function Sorting({sortingAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const dropdownRows = useAtomValue(dropdownRowsAtom)
  const [sorting, setSorting] = useAtom(sortingAtom)

  return (
    <Dropdown
      size={'large'}
      activeRowType={sorting}
      placeholder={t('filterOffers.selectSortingMethod')}
      setActiveRowType={setSorting}
      rows={dropdownRows}
    />
  )
}

export default Sorting
