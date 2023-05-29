import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import plusSvg from './images/plusSvg'
import {getTokens, Text, XStack} from 'tamagui'
import {useAtomValue} from 'jotai'
import OffersList from '../OffersList'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import {
  myActiveOffersAtom,
  myOffersSortedAtomsAtom,
} from '../../state/marketplace/atom'
import {selectAtom} from 'jotai/utils'
import React from 'react'
import MyOffersSortingDropdown from './components/MyOffersSortingDropdown'

type Props = RootStackScreenProps<'MyOffers'>

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

function MyOffersScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()

  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)

  return (
    <Screen customHorizontalPadding={tokens.space[4].val}>
      <ScreenTitle text={t('common.myOffers')} withBottomBorder>
        <IconButton
          variant="dark"
          icon={closeSvg}
          onPress={() => {
            navigation.navigate('InsideTabs', {screen: 'Marketplace'})
          }}
        />
      </ScreenTitle>
      <XStack
        pos={'relative'}
        py={'$4'}
        px={'$2'}
        ai={'center'}
        jc={'space-between'}
      >
        <Text ff={'$body600'} fos={18} col={'$white'}>
          {t('myOffers.activeOffers', {count: activeOffersCount})}
        </Text>
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
      <OffersList offersAtoms={myOffersSortedAtoms} />
    </Screen>
  )
}

export default MyOffersScreen
