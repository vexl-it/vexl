import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import plusSvg from './images/plusSvg'
import {Text, XStack} from 'tamagui'
import {useAtomValue} from 'jotai'
import chevronDownSvg from './images/chevronDownSvg'
import OffersList from '../OffersList'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import {myActiveOffersAtom, myOffersAtom} from '../../state/marketplace/atom'
import {selectAtom} from 'jotai/utils'

type Props = RootStackScreenProps<'MyOffers'>

const myActiveOffers = selectAtom(myActiveOffersAtom, (offers) => offers.length)

function MyOffersScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  const myOffers = useAtomValue(myOffersAtom)
  const activeOffersCount = useAtomValue(myActiveOffers)

  return (
    <Screen>
      <ScreenTitle text={t('myOffers.myOffers')} withBottomBorder>
        <IconButton
          variant="dark"
          icon={closeSvg}
          onPress={() => {
            navigation.goBack()
          }}
        />
      </ScreenTitle>
      <XStack py={'$4'} px={'$2'} ai={'center'} jc={'space-between'}>
        <Text ff={'$body600'} fos={18} col={'$white'}>
          {t('myOffers.activeOffers', {count: activeOffersCount})}
        </Text>
        <Button
          text={t('myOffers.filterOffers')}
          onPress={() => {}}
          variant={'blackOnDark'}
          afterIcon={chevronDownSvg}
          size={'small'}
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
      <OffersList offers={myOffers} />
    </Screen>
  )
}

export default MyOffersScreen
