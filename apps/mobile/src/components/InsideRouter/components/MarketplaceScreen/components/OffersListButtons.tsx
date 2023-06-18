import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import addIconSvg from '../../../../../images/addIconSvg'
import {Stack, XStack} from 'tamagui'
import FilterButton from './FilterButton'

interface Props {
  onAddPress: () => void
  onFilterOffersPress: () => void
  onMyOffersPress: () => void
}

function OffersListButtons({
  onAddPress,
  onFilterOffersPress,
  onMyOffersPress,
}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <XStack mt="$4" mx="$2" jc="space-between">
      <FilterButton onFilterOffersPress={onFilterOffersPress} />
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
