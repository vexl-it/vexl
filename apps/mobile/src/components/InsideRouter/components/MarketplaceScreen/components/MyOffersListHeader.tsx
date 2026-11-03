import {
  ArrowsVerticalSort,
  Button,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {
  myOffersCountAtom,
  selectedMyOffersSortingOptionAtom,
} from '../../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'

function MyOffersListHeader(): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const allOffersCount = useAtomValue(myOffersCountAtom)
  const [sortingOption, setSortingOption] = useAtom(
    selectedMyOffersSortingOptionAtom
  )

  const toggleSorting = useCallback(() => {
    setSortingOption((prev) =>
      prev === 'NEWEST_OFFER' ? 'OLDEST_OFFER' : 'NEWEST_OFFER'
    )
  }, [setSortingOption])

  const sortButtonLabel =
    sortingOption === 'NEWEST_OFFER'
      ? t('marketplace.sortByOldest')
      : t('marketplace.sortByNewest')

  if (allOffersCount === 0) {
    return null
  }

  return (
    <YStack paddingHorizontal="$5">
      <XStack
        paddingTop="$7"
        paddingBottom="$5"
        paddingHorizontal="$2"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="description" color="$foregroundSecondary">
          {t('marketplace.offersCountFormatted', {
            localizedString: formatInteger(allOffersCount, locale),
          })}
        </Typography>
        <Button
          variant="link"
          size="small"
          icon={ArrowsVerticalSort}
          onPress={toggleSorting}
        >
          {sortButtonLabel}
        </Button>
      </XStack>
      <ReencryptOffersSuggestion />
    </YStack>
  )
}

export default MyOffersListHeader
