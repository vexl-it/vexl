import {ArrowsVerticalSort, Typography} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useCallback} from 'react'
import {Stack, useTheme, XStack} from 'tamagui'
import {
  myActiveOffersAtom,
  myOffersSortedAtomsAtom,
  selectedMyOffersSortingOptionAtom,
} from '../../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import MarketplaceInlineButton from './MarketplaceInlineButton'
import VexlNewsSuggestions from './VexlNewsSuggestions'

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

function MyOffersListHeader(): React.ReactElement | null {
  const {t} = useTranslation()
  const theme = useTheme()
  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)
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
            {t('marketplace.offersCount', {count: activeOffersCount})}
          </Typography>
          <MarketplaceInlineButton
            icon={
              <ArrowsVerticalSort
                size={18}
                color={theme.accentYellowPrimary.val}
              />
            }
            label={sortButtonLabel}
            color={theme.accentYellowPrimary.val}
            onPress={toggleSorting}
          />
        </XStack>
      </Stack>
      {myOffersSortedAtoms.length > 0 ? (
        <Stack gap="$6">
          <VexlNewsSuggestions />
          <ReencryptOffersSuggestion />
        </Stack>
      ) : null}
    </Stack>
  )
}

export default MyOffersListHeader
