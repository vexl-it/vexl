import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import {offersToSeeInMarketplaceCountAtom} from '../../../../../state/marketplace/atoms/filteredOffersCountAtoms'
import marketplaceLayoutModeAtom from '../../../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

interface Props {
  filteredOffersCount: number
}

function TotalOffersCount({filteredOffersCount}: Props): React.ReactElement {
  const {t} = useTranslation()
  const marketplaceLayout = useAtomValue(marketplaceLayoutModeAtom)
  const totalCount = useAtomValue(offersToSeeInMarketplaceCountAtom)

  return (
    <Stack als="flex-start" my="$2">
      {marketplaceLayout === 'map' && (
        <Text ff="$body600" color="$greyOnBlack">
          {t('map.showingOnlyInPersonOffers')}
        </Text>
      )}
      <Text ff="$body600" color="$greyOnBlack">
        {totalCount !== filteredOffersCount
          ? t('offer.totalFilteredOffers', {
              count: filteredOffersCount,
              totalCount,
            })
          : t('offer.totalOffers', {
              totalCount,
            })}
      </Text>
    </Stack>
  )
}

export default TotalOffersCount
