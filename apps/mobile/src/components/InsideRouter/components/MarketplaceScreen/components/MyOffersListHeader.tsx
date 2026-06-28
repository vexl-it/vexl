import {ArrowsVerticalSort, Typography} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, useTheme, XStack} from 'tamagui'
import {
  myOffersSortedAtomsAtom,
  selectedMyOffersSortingOptionAtom,
} from '../../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import MarketplaceInlineButton from './MarketplaceInlineButton'

function MyOffersListHeader(): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const theme = useTheme()
  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const allOffersCount = myOffersSortedAtoms.length
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

  if (myOffersSortedAtoms.length === 0) {
    return null
  }

  return (
    <Stack>
      <Stack paddingHorizontal="$5">
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
          <MarketplaceInlineButton
            icon={
              <ArrowsVerticalSort
                size={18}
                color={theme.accentHighlightPrimary.get()}
              />
            }
            label={sortButtonLabel}
            color={theme.accentHighlightPrimary.get()}
            onPress={toggleSorting}
          />
        </XStack>
      </Stack>
      <Stack gap="$6">
        <ReencryptOffersSuggestion />
      </Stack>
    </Stack>
  )
}

export default MyOffersListHeader
