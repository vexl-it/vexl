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
import Button from '../../../Button'
import OffersList from '../../../OffersList'
import ReencryptOffersSuggestion from '../../../ReencryptOffersSuggestion'
import plusSvg from '../../../images/plusSvg'
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

  return (
    <ContainerWithTopBorderRadius withTopPadding>
      <Stack mx="$4" f={1}>
        <Text ff="$heading" color="$white" fos={32}>
          {t('common.myOffers')}
        </Text>
        <XStack pos="relative" py="$4" px="$2" ai="center" jc="space-between">
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
        <Button
          beforeIcon={plusSvg}
          onPress={() => {
            navigation.navigate('CreateOffer')
          }}
          size="medium"
          text={t('myOffers.addNewOffer')}
          variant="secondary"
        />
        <OffersList
          ListHeaderComponent={ListHeaderComponent}
          offersAtoms={myOffersSortedAtoms}
        />
      </Stack>
    </ContainerWithTopBorderRadius>
  )
}

export default MyOffersScreen
