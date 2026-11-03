import {useNavigation} from '@react-navigation/native'
import {EmptyState} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

export const FEW_FILTERED_OFFERS_NOTICE_MAX_COUNT = 3

export function shouldShowFewFilteredOffersNotice({
  isMarketplaceNarrowingActive,
  offersCount,
}: {
  readonly isMarketplaceNarrowingActive: boolean
  readonly offersCount: number
}): boolean {
  return (
    isMarketplaceNarrowingActive &&
    offersCount > 0 &&
    offersCount <= FEW_FILTERED_OFFERS_NOTICE_MAX_COUNT
  )
}

function FewFilteredOffersNotice({
  withHorizontalPadding = true,
}: {
  readonly withHorizontalPadding?: boolean
}): React.JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const onEditFiltersPress = useCallback(() => {
    navigation.navigate('FilterOffers')
  }, [navigation])

  return (
    <EmptyState
      paddingHorizontal={withHorizontalPadding ? '$5' : '$0'}
      description={t('marketplace.fewOffersAfterFiltering')}
      action={{
        label: t('marketplace.editFilters'),
        onPress: onEditFiltersPress,
      }}
    />
  )
}

export default FewFilteredOffersNotice
