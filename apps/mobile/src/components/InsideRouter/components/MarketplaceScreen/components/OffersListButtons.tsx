import {useAtomValue} from 'jotai'
import {Stack, XStack} from 'tamagui'
import addIconSvg from '../../../../../images/addIconSvg'
import {isFilterActiveAtom} from '../../../../../state/marketplace/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import FilterButtons from './FilterButtons'

interface Props {
  marketplaceEmpty: boolean
  onAddPress: () => void
  onMyOffersPress: () => void
}

function OffersListButtons({
  marketplaceEmpty,
  onAddPress,
  onMyOffersPress,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const filterActive = useAtomValue(isFilterActiveAtom)

  return (
    <XStack mt="$4" mx="$2" jc="space-between" space="$2">
      <Stack f={1}>
        {!marketplaceEmpty || filterActive ? <FilterButtons /> : <Stack />}
      </Stack>
      <XStack space="$2" mx="$1">
        <Button
          onPress={onMyOffersPress}
          variant="primary"
          size="small"
          text={t('common.myOffers')}
          numberOfLines={2}
        />
        <Button
          onPress={onAddPress}
          variant="primary"
          size="small"
          afterIcon={addIconSvg}
        />
      </XStack>
    </XStack>
  )
}

export default OffersListButtons
