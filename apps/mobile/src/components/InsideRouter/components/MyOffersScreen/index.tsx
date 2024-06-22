import {useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React from 'react'
import {Stack, Text, XStack} from 'tamagui'
import {type RootStackScreenProps} from '../../../../navigationTypes'
import {
  myActiveOffersAtom,
  myOffersSortedAtomsAtom,
} from '../../../../state/marketplace/atoms/myOffers'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../EmptyListWrapper'
import OffersList from '../../../OffersList'
import ReencryptOffersSuggestion from '../../../ReencryptOffersSuggestion'
import usePixelsFromBottomWhereTabsEnd from '../../utils'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import MyOffersSortingDropdown from './components/MyOffersSortingDropdown'

type Props = RootStackScreenProps<'MyOffers'>

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

function ListHeaderComponent(): JSX.Element {
  return (
    <Stack mt="$4">
      <ReencryptOffersSuggestion px="$0" />
    </Stack>
  )
}

function MyOffersScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return (
    <ContainerWithTopBorderRadius>
      <Stack f={1}>
        <Stack mx="$2">
          <Text ff="$heading" color="$white" fos={32}>
            {t('common.myOffers')}
          </Text>
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
          <OffersList
            ListHeaderComponent={ListHeaderComponent}
            offersAtoms={myOffersSortedAtoms}
          />
        ) : (
          <Stack f={1} pb={tabBarEndsAt}>
            <EmptyListWrapper
              buttonText={t('myOffers.addNewOffer')}
              onButtonPress={() => {
                navigation.navigate('CRUDOfferFlow', {
                  screen: 'ListingAndOfferType',
                })
              }}
            >
              <Text
                textAlign="center"
                col="$greyOnWhite"
                fos={20}
                ff="$body600"
              >
                {t('myOffers.youHaveNotPostedAnyOffers')}
              </Text>
            </EmptyListWrapper>
          </Stack>
        )}
      </Stack>
    </ContainerWithTopBorderRadius>
  )
}

export default MyOffersScreen
