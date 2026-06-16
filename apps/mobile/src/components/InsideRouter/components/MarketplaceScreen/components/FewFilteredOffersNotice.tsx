import {useNavigation} from '@react-navigation/native'
import {Button, Typography} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
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
    <Stack
      gap="$5"
      paddingTop="$5"
      paddingHorizontal={withHorizontalPadding ? '$5' : '$0'}
    >
      <Typography
        color="$foregroundSecondary"
        textAlign="center"
        variant="description"
      >
        {t('marketplace.fewOffersAfterFiltering')}
      </Typography>
      <Button
        variant="tertiary"
        size="small"
        onPress={onEditFiltersPress}
        width="100%"
      >
        {t('marketplace.editFilters')}
      </Button>
    </Stack>
  )
}

export default FewFilteredOffersNotice
