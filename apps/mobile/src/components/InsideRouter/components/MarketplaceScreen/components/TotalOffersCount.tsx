import {useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import marketplaceLayoutModeAtom from '../../../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {
  buyOffersToSeeInMarketplaceCountAtom,
  sellOffersToSeeInMarketplaceCountAtom,
} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

interface Props {
  filteredOffersCount: number
  offerType: 'BUY' | 'SELL'
}

function TotalOffersCount({
  filteredOffersCount,
  offerType,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const marketplaceLayout = useAtomValue(marketplaceLayoutModeAtom)
  const totalCount = useAtomValue(
    offerType === 'BUY'
      ? buyOffersToSeeInMarketplaceCountAtom
      : sellOffersToSeeInMarketplaceCountAtom
  )

  return (
    <Stack als="flex-start" my="$2" mx="$2">
      {marketplaceLayout === 'map' && (
        <Text ff="$body600" color="$greyOnBlack">
          {t('map.showingOnlyInPersonOffers')}
        </Text>
      )}
      <Text fs={48} ff="$body600" color="$greyOnBlack">
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
