import {useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React from 'react'
import {Stack, Text, XStack} from 'tamagui'
import {
  myActiveOffersAtom,
  myOffersSortedAtomsAtom,
} from '../../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import MyOffersSortingDropdown from '../../MyOffersScreen/components/MyOffersSortingDropdown'
import VexlNewsSuggestions from './VexlNewsSuggestions'

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

function MyOffersListHeader(): React.ReactElement {
  const {t} = useTranslation()
  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)

  return (
    <Stack>
      <Stack mx="$2">
        <XStack pos="relative" py="$4" ai="center" jc="space-between">
          <Stack f={1}>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              ff="$body600"
              fos={18}
              col="$white"
            >
              {t('myOffers.activeOffers', {count: activeOffersCount})}
            </Text>
          </Stack>
          <MyOffersSortingDropdown />
        </XStack>
      </Stack>
      {myOffersSortedAtoms.length > 0 ? (
        <Stack my="$4" gap="$6">
          <VexlNewsSuggestions />
          <ReencryptOffersSuggestion />
        </Stack>
      ) : null}
    </Stack>
  )
}

export default MyOffersListHeader
