import {useNavigation} from '@react-navigation/native'
import {EmptyState} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function FilteredOffersEmptyState(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const onEditFiltersPress = useCallback(() => {
    navigation.navigate('FilterOffers')
  }, [navigation])

  return (
    <EmptyState
      paddingHorizontal="$5"
      title={t('marketplace.noOffersYet')}
      description={t('marketplace.tryAdjustingFilters')}
      action={{
        label: t('marketplace.editFilters'),
        onPress: onEditFiltersPress,
      }}
    />
  )
}

export default FilteredOffersEmptyState
