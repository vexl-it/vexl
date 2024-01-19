import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import {
  isFilterActiveAtom,
  isTextFilterActiveAtom,
} from '../../../../../state/marketplace/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {Stack, XStack} from 'tamagui'
import {useNavigation} from '@react-navigation/native'
import {useCallback} from 'react'
import IconButton from '../../../../IconButton'
import magnifyingGlass from '../../../../images/magnifyingGlass'

function FilterButtons(): JSX.Element {
  const {t} = useTranslation()
  const isFilterActive = useAtomValue(isFilterActiveAtom)
  const isTextFilterActive = useAtomValue(isTextFilterActiveAtom)
  const navigation = useNavigation()

  const onFilterOffersPress = useCallback(() => {
    navigation.navigate('FilterOffers')
  }, [navigation])

  const onSearchOffersPress = useCallback(() => {
    navigation.navigate('SearchOffers')
  }, [navigation])

  return (
    <XStack space="$2">
      <Stack flex={1}>
        <Button
          onPress={onFilterOffersPress}
          variant={isFilterActive ? 'secondary' : 'blackOnDark'}
          size="small"
          text={t(isFilterActive ? 'offer.filterActive' : 'offer.filterOffers')}
          afterIcon={downArrow}
          numberOfLines={2}
        />
      </Stack>
      <IconButton
        height={38}
        onPress={onSearchOffersPress}
        variant={isTextFilterActive ? 'secondary' : 'dark'}
        icon={magnifyingGlass}
      ></IconButton>
    </XStack>
  )
}

export default FilterButtons
