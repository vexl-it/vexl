import {useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import {isFilterActiveAtom} from '../../../../../state/marketplace/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  buyOffersToSeeInMarketplaceCountAtom,
  sellOffersToSeeInMarketplaceCountAtom,
} from '../../../../../state/marketplace/atom'

interface Props {
  filteredOffersCount: number
  offerType: 'BUY' | 'SELL'
}

function TotalOffersCount({
  filteredOffersCount,
  offerType,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const filterActive = useAtomValue(isFilterActiveAtom)
  const buyOffersCount = useAtomValue(buyOffersToSeeInMarketplaceCountAtom)
  const sellOffersCount = useAtomValue(sellOffersToSeeInMarketplaceCountAtom)

  return (
    <Stack als={'flex-start'} my={'$2'} mx="$2">
      <Text ff={'$body600'} color={'$greyOnBlack'}>
        {filterActive
          ? t('offer.totalFilteredOffers', {
              count: filteredOffersCount,
              totalCount:
                offerType === 'BUY' ? buyOffersCount : sellOffersCount,
            })
          : t('offer.totalOffers', {
              totalCount:
                offerType === 'BUY' ? buyOffersCount : sellOffersCount,
            })}
      </Text>
    </Stack>
  )
}

export default TotalOffersCount
