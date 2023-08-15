import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import {isFilterActiveAtom} from '../../../../FilterOffersScreen/atom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'

interface Props {
  onFilterOffersPress: () => void
}

function FilterButton({onFilterOffersPress}: Props): JSX.Element {
  const {t} = useTranslation()
  const isFilterActive = useAtomValue(isFilterActiveAtom)

  return (
    <Button
      onPress={onFilterOffersPress}
      variant={isFilterActive ? 'secondary' : 'blackOnDark'}
      size={'small'}
      text={t(isFilterActive ? 'offer.filterActive' : 'offer.filterOffers')}
      afterIcon={downArrow}
      numberOfLines={2}
    />
  )
}

export default FilterButton
