import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import plusSvg from './images/plusSvg'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useAtomValue} from 'jotai'
import OffersList from '../OffersList'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import {
  myActiveOffersAtom,
  myOffersSortedAtomsAtom,
} from '../../state/marketplace/atoms/myOffers'
import ReencryptOffersSuggestion from '../ReencryptOffersSuggestion'
import {selectAtom} from 'jotai/utils'
import React from 'react'
import MyOffersSortingDropdown from './components/MyOffersSortingDropdown'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'MyOffers'>

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

function ListHeaderComponent(): JSX.Element {
  return (
    <Stack mt="$4">
      <ReencryptOffersSuggestion px={'$0'} />
    </Stack>
  )
}

function MyOffersScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const tokens = getTokens()

  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)

  return (
    <Screen customHorizontalPadding={tokens.space[2].val}>
      <ScreenTitle text={t('common.myOffers')} withBottomBorder>
        <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
      </ScreenTitle>
      <XStack
        pos={'relative'}
        py={'$4'}
        px={'$2'}
        ai={'center'}
        jc={'space-between'}
      >
        <Stack f={1}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            ff={'$body600'}
            fos={18}
            col={'$white'}
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
        size={'medium'}
        text={t('myOffers.addNewOffer')}
        variant={'secondary'}
      />
      <OffersList
        ListHeaderComponent={ListHeaderComponent}
        offersAtoms={myOffersSortedAtoms}
      />
    </Screen>
  )
}

export default MyOffersScreen
