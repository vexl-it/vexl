import Dropdown, {type RowProps} from '../../Dropdown'
import React from 'react'
import {atom, useAtom, useAtomValue} from 'jotai'
import {selectedMyOffersSortingOptionAtom} from '../../../state/marketplace/atom'
import {type Sort} from '@vexl-next/domain/dist/general/offers'
import {translationAtom} from '../../../utils/localization/I18nProvider'

const myOffersSortingOptionsAtom = atom<Array<RowProps<Sort>>>((get) => {
  const {t} = get(translationAtom)

  return [
    {
      title: t('myOffers.sortedByNewest'),
      type: 'NEWEST_OFFER',
    },
    {
      title: t('myOffers.sortedByOldest'),
      type: 'OLDEST_OFFER',
    },
  ]
})

function MyOffersSortingDropdown(): JSX.Element {
  const [myOffersSortingOption, setMyOffersSortingOption] = useAtom(
    selectedMyOffersSortingOptionAtom
  )
  const myOffersSortingOptions = useAtomValue(myOffersSortingOptionsAtom)

  return (
    <Dropdown
      size={'small'}
      activeRowType={myOffersSortingOption}
      setActiveRowType={setMyOffersSortingOption}
      rows={myOffersSortingOptions}
    />
  )
}

export default MyOffersSortingDropdown
