import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import {
  isFilterActiveActionAtom,
  isFilterActiveAtom,
} from '../../../../FilterOffersScreen/atom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'
import {useAtomValue, useSetAtom} from 'jotai'

interface Props {
  onFilterOffersPress: () => void
}

function FilterButton({onFilterOffersPress}: Props): JSX.Element {
  const {t} = useTranslation()
  const setIsFilterActive = useSetAtom(isFilterActiveActionAtom)
  const filterActive = useAtomValue(isFilterActiveAtom)

  useFocusEffect(useCallback(setIsFilterActive, [setIsFilterActive]))

  return (
    <Button
      onPress={onFilterOffersPress}
      variant={filterActive ? 'secondary' : 'blackOnDark'}
      size={'small'}
      text={t(filterActive ? 'offer.filterActive' : 'offer.filterOffers')}
      afterIcon={downArrow}
    />
  )
}

export default FilterButton
