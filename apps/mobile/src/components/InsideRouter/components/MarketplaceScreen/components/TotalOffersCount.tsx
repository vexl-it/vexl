import {useAtomValue} from 'jotai'
import {filterActiveAtom} from '../../../../FilterOffersScreen/atom'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {offersCountAtom} from '../../../../../state/marketplace/atom'

interface Props {
  filteredOffersCount: number
}

function TotalOffersCount({filteredOffersCount}: Props): JSX.Element {
  const {t} = useTranslation()
  const filterActive = useAtomValue(filterActiveAtom)
  const offersCount = useAtomValue(offersCountAtom)

  return (
    <Stack als={'flex-start'} my={'$2'} mx="$2">
      <Text ff={'$body600'} color={'$greyOnBlack'}>
        {filterActive
          ? t('offer.totalFilteredOffers', {
              count: filteredOffersCount,
              totalCount: offersCount,
            })
          : t('offer.totalOffers', {totalCount: offersCount})}
      </Text>
    </Stack>
  )
}

export default TotalOffersCount
