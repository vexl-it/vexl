import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import addIconSvg from '../../../../../images/addIconSvg'
import {Stack, XStack} from 'tamagui'
import FilterButton from './FilterButton'
import {useAtomValue} from 'jotai'
import {isFilterActiveAtom} from '../../../../FilterOffersScreen/atom'

interface Props {
  marketplaceEmpty: boolean
  onAddPress: () => void
  onFilterOffersPress: () => void
  onMyOffersPress: () => void
}

function OffersListButtons({
  marketplaceEmpty,
  onAddPress,
  onFilterOffersPress,
  onMyOffersPress,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const filterActive = useAtomValue(isFilterActiveAtom)

  return (
    <XStack mt="$4" mx="$2" jc="space-between">
      {!marketplaceEmpty || filterActive ? (
        <FilterButton onFilterOffersPress={onFilterOffersPress} />
      ) : (
        <Stack />
      )}
      <XStack>
        <Button
          onPress={onMyOffersPress}
          variant={'primary'}
          size={'small'}
          text={t('common.myOffers')}
        />
        <Stack w="$2" />
        <Button
          onPress={onAddPress}
          variant={'primary'}
          size={'small'}
          afterIcon={addIconSvg}
        />
      </XStack>
    </XStack>
  )
}

export default OffersListButtons
