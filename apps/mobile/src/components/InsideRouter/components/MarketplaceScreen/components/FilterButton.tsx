import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import {filterActiveAtom} from '../../../../FilterOffersScreen/atom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'
import {useAtom} from 'jotai'

interface Props {
  onFilterOffersPress: () => void
}

function FilterButton({onFilterOffersPress}: Props): JSX.Element {
  const {t} = useTranslation()
  const [filterActive, setIsFilterActive] = useAtom(filterActiveAtom)

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
