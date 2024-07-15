import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useMemo, useState} from 'react'
import {
  type CRUDOfferStackParamsList,
  type RootStackScreenProps,
} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import PageWithButtonAndProgressHeader from '../PageWithButtonAndProgressHeader'
import ProgressJourney from '../ProgressJourney'
import ScreenTitle from '../ScreenTitle'
import EditOfferHeader from './EditOfferHeader'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import CurrencyAndAmountScreen from './components/CurrencyAndAmountScreen'
import DeliveryMethodAndNetworkScreen from './components/DeliveryMethodAndNetworkScreen'
import FriendLevelScreen from './components/FriendLevelScreen'
import ListingAndOfferTypeScreen from './components/ListingAndOfferTypeScreen'
import LocationPaymentMethodAndNetworkScreen from './components/LocationPaymentMethodAndNetworkScreen'
import OfferDescriptionAndSpokenLanguagesScreen from './components/OfferDescriptionAndSpokenLanguagesScreen'
import PriceScreen from './components/PriceScreen'
import SummaryScreen from './components/SummaryScreen'

const btcOfferScreens: Array<keyof CRUDOfferStackParamsList> = [
  'ListingAndOfferType',
  'CurrencyAndAmount',
  'LocationPaymentMethodAndNetworkScreen',
  'OfferDescriptionAndSpokenLanguagesScreen',
  'FriendLevelScreen',
  'SummaryScreen',
]

const productOfferScreens: Array<keyof CRUDOfferStackParamsList> = [
  'ListingAndOfferType',
  'PriceScreen',
  'DeliveryMethodAndNetworkScreen',
  'OfferDescriptionAndSpokenLanguagesScreen',
  'FriendLevelScreen',
  'SummaryScreen',
]

const otherOfferScreens: Array<keyof CRUDOfferStackParamsList> = [
  'ListingAndOfferType',
  'PriceScreen',
  'LocationPaymentMethodAndNetworkScreen',
  'OfferDescriptionAndSpokenLanguagesScreen',
  'FriendLevelScreen',
  'SummaryScreen',
]

const CRUDOfferStack = createNativeStackNavigator<CRUDOfferStackParamsList>()

type Props = RootStackScreenProps<'CRUDOfferFlow'>

function CRUDOfferFlow({route: {params}, navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [page, setPage] = useState(0)
  const safeGoBack = useSafeGoBack()
  const {
    listingTypeAtom,
    editOfferActionAtom,
    createOfferActionAtom,
    nextButtonInOfferModificationDisabledAtom,
    currentStepInOfferCreationAtom,
  } = useMolecule(offerFormMolecule)

  const listingType = useAtomValue(listingTypeAtom)
  const createOffer = useSetAtom(createOfferActionAtom)
  const editOffer = useSetAtom(editOfferActionAtom)
  const setCurrentStepInOfferCreation = useSetAtom(
    currentStepInOfferCreationAtom
  )

  const screensBasedOnListingType = useMemo(
    () =>
      listingType === 'BITCOIN'
        ? btcOfferScreens
        : listingType === 'PRODUCT'
        ? productOfferScreens
        : listingType === 'OTHER'
        ? otherOfferScreens
        : [],
    [listingType]
  )

  const onPageChange = useCallback(
    (pageIndex: number) => {
      const currentPage =
        screensBasedOnListingType[pageIndex] ?? 'ListingAndOfferType'
      setCurrentStepInOfferCreation(currentPage)
      navigation.navigate('CRUDOfferFlow', {
        screen: currentPage,
        offerId: params.offerId,
      })
      setPage(pageIndex)
    },
    [
      navigation,
      params.offerId,
      screensBasedOnListingType,
      setCurrentStepInOfferCreation,
    ]
  )

  return (
    <PageWithButtonAndProgressHeader>
      {!params.offerId ? (
        <ScreenTitle
          text={t('offerForm.myNewOffer')}
          withBottomBorder
          withBackButton
        />
      ) : (
        <EditOfferHeader offerId={params.offerId} />
      )}
      <ProgressJourney
        withBackButton
        currentPage={page}
        numberOfPages={screensBasedOnListingType.length}
        onPageChange={(nextPageIndex) => {
          if (nextPageIndex < screensBasedOnListingType.length) {
            onPageChange(nextPageIndex)
          }
        }}
        onSkip={safeGoBack}
        onFinish={() => {
          if (params.offerId) {
            void editOffer()().then((success) => {
              if (success) {
                navigation.navigate('InsideTabs', {
                  screen: 'MyOffers',
                })
              }
            })
          } else {
            void createOffer()().then((success) => {
              if (success) {
                navigation.navigate('InsideTabs', {
                  screen: 'MyOffers',
                })
              }
            })
          }
        }}
        background="black"
        touchableOverlayDisabled
        nextButtonDisabledAtom={nextButtonInOfferModificationDisabledAtom}
      >
        <CRUDOfferStack.Navigator
          screenOptions={{
            headerShown: false,
            presentation: 'card',
          }}
          initialRouteName="ListingAndOfferType"
        >
          <CRUDOfferStack.Screen
            name="ListingAndOfferType"
            component={ListingAndOfferTypeScreen}
          />
          <CRUDOfferStack.Screen
            name="CurrencyAndAmount"
            component={CurrencyAndAmountScreen}
          />
          <CRUDOfferStack.Screen
            name="LocationPaymentMethodAndNetworkScreen"
            component={LocationPaymentMethodAndNetworkScreen}
          />
          <CRUDOfferStack.Screen
            name="OfferDescriptionAndSpokenLanguagesScreen"
            component={OfferDescriptionAndSpokenLanguagesScreen}
          />
          <CRUDOfferStack.Screen
            name="FriendLevelScreen"
            component={FriendLevelScreen}
          />
          <CRUDOfferStack.Screen
            name="DeliveryMethodAndNetworkScreen"
            component={DeliveryMethodAndNetworkScreen}
          />
          <CRUDOfferStack.Screen
            name="SummaryScreen"
            component={SummaryScreen}
          />
          <CRUDOfferStack.Screen name="PriceScreen" component={PriceScreen} />
        </CRUDOfferStack.Navigator>
      </ProgressJourney>
    </PageWithButtonAndProgressHeader>
  )
}

export default CRUDOfferFlow
