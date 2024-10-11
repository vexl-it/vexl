import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useState} from 'react'
import {StatusBar} from 'react-native'
import {Stack} from 'tamagui'
import {
  type CRUDOfferStackParamsList,
  type RootStackScreenProps,
} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import ProgressJourney from '../ProgressJourney'
import Screen from '../Screen'
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

const CRUDOfferStack = createNativeStackNavigator<CRUDOfferStackParamsList>()

type Props = RootStackScreenProps<'CRUDOfferFlow'>

function CRUDOfferFlow({route: {params}, navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const [page, setPage] = useState(0)
  const safeGoBack = useSafeGoBack()
  const {
    screensBasedOnListingTypeAtom,
    editOfferActionAtom,
    createOfferActionAtom,
    currentStepInOfferCreationAtom,
    emitAlertBasedOnCurrentStepIfAnyAtom,
    dontAllowNavigationToNextStepAndReturnReasonAtom,
  } = useMolecule(offerFormMolecule)

  const screensBasedOnListingType = useAtomValue(screensBasedOnListingTypeAtom)
  const emitAlertBasedOnCurrentStepIfAny = useSetAtom(
    emitAlertBasedOnCurrentStepIfAnyAtom
  )
  const dontAllowNavigationToNextStepAndReturnReason = useAtomValue(
    dontAllowNavigationToNextStepAndReturnReasonAtom
  )
  const createOffer = useSetAtom(createOfferActionAtom)
  const editOffer = useSetAtom(editOfferActionAtom)
  const setCurrentStepInOfferCreation = useSetAtom(
    currentStepInOfferCreationAtom
  )

  const onPageChange = useCallback(
    (prevOrNextPageIndex: number) => {
      const currentPage =
        screensBasedOnListingType[prevOrNextPageIndex] ?? 'ListingAndOfferType'
      if (
        prevOrNextPageIndex < page ||
        !dontAllowNavigationToNextStepAndReturnReason
      ) {
        setCurrentStepInOfferCreation(currentPage)
        navigation.navigate('CRUDOfferFlow', {
          screen: currentPage,
          offerId: params.offerId,
        })
        setPage(prevOrNextPageIndex)
      } else {
        emitAlertBasedOnCurrentStepIfAny()
      }
    },
    [
      dontAllowNavigationToNextStepAndReturnReason,
      emitAlertBasedOnCurrentStepIfAny,
      navigation,
      page,
      params.offerId,
      screensBasedOnListingType,
      setCurrentStepInOfferCreation,
    ]
  )

  return (
    <Screen>
      <KeyboardAvoidingView>
        <Stack style={{height: StatusBar.currentHeight ?? 0}} />
        <Stack f={1} px="$2" pb="$2">
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
              if (
                screensBasedOnListingType.length === 0 ||
                nextPageIndex < screensBasedOnListingType.length
              ) {
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
              <CRUDOfferStack.Screen
                name="PriceScreen"
                component={PriceScreen}
              />
            </CRUDOfferStack.Navigator>
          </ProgressJourney>
        </Stack>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CRUDOfferFlow
