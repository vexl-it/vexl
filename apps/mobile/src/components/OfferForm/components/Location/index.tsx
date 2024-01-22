import {
  type Location,
  type LocationState,
} from '@vexl-next/domain/src/general/offers'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {useState} from 'react'
import {Modal, TouchableOpacity, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Help from '../../../Help'
import IconButton from '../../../IconButton'
import SvgImage from '../../../Image'
import Info from '../../../Info'
import LocationSearch from '../../../LocationSearch'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../../LocationSearch/molecule'
import Screen from '../../../Screen'
import ScreenTitle from '../../../ScreenTitle'
import Tabs from '../../../Tabs'
import anonymousCounterpartSvg from '../../../images/anonymousCounterpartSvg'
import closeSvg from '../../../images/closeSvg'
import magnifyingGlass from '../../../images/magnifyingGlass'
import useContent from './useContent'

interface Props {
  setOfferLocationActionAtom: WritableAtom<
    null,
    [locationSuggestionAtom: LocationSuggestion],
    void
  >
  locationAtom: PrimitiveAtom<Location[] | undefined>
  locationStateAtom: PrimitiveAtom<LocationState | undefined>
  updateLocationStatePaymentMethodAtom: WritableAtom<
    null,
    [
      {
        locationState: LocationState
      },
    ],
    boolean
  >
}

function LocationComponent({
  setOfferLocationActionAtom,
  locationAtom,
  locationStateAtom,
  updateLocationStatePaymentMethodAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const content = useContent()

  const [location, setLocation] = useAtom(locationAtom)
  const locationState = useAtomValue(locationStateAtom)
  const updateLocationStatePaymentMethod = useSetAtom(
    updateLocationStatePaymentMethodAtom
  )
  const [helpVisible, setHelpVisible] = useState<boolean>(false)

  const [locationSearchVisible, setLocationSearchVisible] =
    useState<LocationSessionId | null>(null)

  const setOfferLocation = useSetAtom(setOfferLocationActionAtom)

  const onLocationStateChange = (locationState: LocationState): void => {
    updateLocationStatePaymentMethod({locationState})
  }

  const onLocationRemove = (city: string): void => {
    const filteredLocation = location?.filter((loc) => loc.city !== city)
    if (filteredLocation) setLocation(filteredLocation)
  }

  return (
    <YStack space="$2">
      <Tabs
        activeTab={locationState}
        onTabPress={onLocationStateChange}
        tabs={content}
      />
      {locationState === 'IN_PERSON' && (
        <YStack space="$2">
          {(!location || (location && location.length < 3)) && (
            <TouchableWithoutFeedback
              onPress={() => {
                setLocationSearchVisible(newLocationSessionId())
              }}
            >
              <XStack ai="center" p="$5" bc="$grey" br="$5">
                <Stack h={24} w={24}>
                  <SvgImage
                    stroke={tokens.color.white.val}
                    source={magnifyingGlass}
                  />
                </Stack>
                <Text ml="$4" ff="$body600" fos={18} col="$greyOnBlack">
                  {t('offerForm.location.addCityOrDistrict')}
                </Text>
              </XStack>
            </TouchableWithoutFeedback>
          )}
          {location?.map((loc) => (
            <XStack
              key={loc.latitude}
              br="$5"
              bc="$darkBrown"
              p="$4"
              ai="center"
              jc="space-between"
            >
              <Text fos={18} color="$main">
                {loc.city}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onLocationRemove(loc.city)
                }}
              >
                <SvgImage stroke={tokens.color.main.val} source={closeSvg} />
              </TouchableOpacity>
            </XStack>
          ))}
        </YStack>
      )}
      {locationState === 'ONLINE' && (
        <Info
          actionButtonText={t('offerForm.location.checkItOut')}
          text={t('offerForm.location.meetingInPerson')}
          onActionPress={() => {
            setHelpVisible(true)
          }}
        />
      )}
      {locationSearchVisible && (
        <Modal
          animationType="fade"
          visible={!!locationSearchVisible}
          onRequestClose={() => {
            setLocationSearchVisible(null)
          }}
          // Looks like it is not needed anymore.
          // onShow={() => {
          //   if (Platform.OS === 'android') {
          //     setTimeout(() => {
          //       inputRef.current?.blur()
          //       inputRef.current?.focus()
          //     }, 100)
          //   }
          // }}
        >
          <Screen customHorizontalPadding={16}>
            <ScreenTitle text="">
              <IconButton
                variant="dark"
                icon={closeSvg}
                onPress={() => {
                  setLocationSearchVisible(null)
                }}
              />
            </ScreenTitle>
            <LocationSearch
              onPress={(a) => {
                setOfferLocation(a)
                setLocationSearchVisible(null)
              }}
              sessionId={locationSearchVisible}
            />
          </Screen>
        </Modal>
      )}
      {helpVisible && (
        <Help
          visible={helpVisible}
          onClose={() => {
            setHelpVisible(false)
          }}
          title={t('offerForm.location.whatToWatchOutForOnline')}
          image={anonymousCounterpartSvg}
        >
          <YStack space="$6">
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.moneySentByRandomPerson')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.neverSendCrypto')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.alwaysVerifyTheName')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.forwardTheAddress')}
            </Text>
          </YStack>
        </Help>
      )}
    </YStack>
  )
}

export default LocationComponent
