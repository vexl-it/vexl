import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {type RootStackScreenProps} from '../../navigationTypes'
import {
  translationAtom,
  useTranslation,
} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import plusSvg from './images/plusSvg'
import {Text, XStack} from 'tamagui'
import {useAtomValue, atom, useAtom} from 'jotai'
import OffersList from '../OffersList'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import {
  myActiveOffersAtom,
  myOffersAtom,
  myOffersSortingOptionAtom,
  sortOffers,
} from '../../state/marketplace/atom'
import {selectAtom} from 'jotai/utils'
import Dropdown, {type RowProps} from '../Dropdown'
import {type Sort} from '@vexl-next/domain/dist/general/offers'
import React, {useMemo} from 'react'

type Props = RootStackScreenProps<'MyOffers'>

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

const myOffersSortingOptionsAtom = atom<Array<RowProps<Sort>>>((get) => {
  const {t} = get(translationAtom)

  return [
    {
      title: t('myOffers.sortedByNewest'),
      type: 'NEWEST_OFFER',
    },
    {
      title: t('myOffers.sortedByOldest'),
      type: 'OLDEST_OFFER',
    },
  ]
})

function MyOffersScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  const [myOffersSortingOption, setMyOffersSortingOption] = useAtom(
    myOffersSortingOptionAtom
  )
  const mySortedOffers = [
    ...useAtomValue(
      useMemo(
        () => sortOffers(myOffersAtom, myOffersSortingOption),
        [myOffersSortingOption]
      )
    ),
  ]
  const myOffersSortingOptions = useAtomValue(myOffersSortingOptionsAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)

  return (
    <Screen>
      <ScreenTitle text={t('myOffers.myOffers')} withBottomBorder>
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
        <Dropdown
          size={'small'}
          activeRowType={myOffersSortingOption}
          setActiveRowType={setMyOffersSortingOption}
          rows={myOffersSortingOptions}
        />
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
      <OffersList offers={mySortedOffers} />
    </Screen>
  )
}

export default MyOffersScreen
