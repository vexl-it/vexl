import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import addIconSvg from '../../../../../images/addIconSvg'
import {Stack, XStack} from 'tamagui'
import {useMolecule} from 'jotai-molecules'
import {filterOffersMolecule} from '../../../../FilterOffersScreen/atom'
import {useAtomValue} from 'jotai'

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
  const {filterAtom} = useMolecule(filterOffersMolecule)
  const filter = useAtomValue(filterAtom)
  return (
    <XStack mt="$4" mx="$2" jc="space-between">
      <Button
        onPress={onFilterOffersPress}
        variant={filter ? 'primary' : 'blackOnDark'}
        size={'small'}
        text={t('offer.filterOffers')}
        afterIcon={downArrow}
      />
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
