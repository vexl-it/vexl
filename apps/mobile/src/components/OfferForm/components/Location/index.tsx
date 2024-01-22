import {
  type LocationState,
  type OfferLocation,
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
import {TouchableOpacity, TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Help from '../../../Help'
import SvgImage from '../../../Image'
import Info from '../../../Info'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../../LocationSearch/molecule'
import Tabs from '../../../Tabs'
import anonymousCounterpartSvg from '../../../images/anonymousCounterpartSvg'
import closeSvg from '../../../images/closeSvg'
import magnifyingGlass from '../../../images/magnifyingGlass'
import SelectLocationFlowModal from './components/SelectLocationFlowModal'
import useContent from './useContent'

interface Props {
  setOfferLocationActionAtom: WritableAtom<
    null,
    [locationSuggestionAtom: LocationSuggestion],
    void
  >
  locationAtom: PrimitiveAtom<OfferLocation[] | undefined>
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
  randomizeLocation: boolean
}

function LocationComponent({
  locationAtom,
  locationStateAtom,
  updateLocationStatePaymentMethodAtom,
  randomizeLocation,
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

  const onLocationStateChange = (locationState: LocationState): void => {
    updateLocationStatePaymentMethod({locationState})
  }

  const onLocationRemove = (locationToRemove: OfferLocation): void => {
    const filteredLocation = location?.filter(
      (loc) => loc.placeId !== locationToRemove.placeId
    )
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
          {!!(!location || (location && location.length < 3)) && (
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
                {loc.address}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onLocationRemove(loc)
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
      <SelectLocationFlowModal
        randomizeLocation={randomizeLocation}
        locationSessionId={locationSearchVisible ?? newLocationSessionId()}
        locationAtom={locationAtom}
        onSetVisible={(visible) => {
          if (visible) setLocationSearchVisible(newLocationSessionId())
          else setLocationSearchVisible(null)
        }}
        visible={!!locationSearchVisible}
      />

      {!!helpVisible && (
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
