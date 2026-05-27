import {useNavigation} from '@react-navigation/native'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {reportFrontendEventActionAtom} from '../../../../../state/analytics/atoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyMarketplaceList from './EmptyMarketplaceList'

function FilteredOffersEmptyState(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const reportFrontendEvent = useSetAtom(reportFrontendEventActionAtom)

  React.useEffect(() => {
    reportFrontendEvent('noOffersFound')
  }, [reportFrontendEvent])

  const onEditFiltersPress = useCallback(() => {
    navigation.navigate('FilterOffers')
  }, [navigation])

  return (
    <EmptyMarketplaceList
      title={t('marketplace.noOffersYet')}
      description={t('marketplace.tryAdjustingFilters')}
      buttonLabel={t('marketplace.editFilters')}
      onButtonPress={onEditFiltersPress}
    />
  )
}

export default FilteredOffersEmptyState
