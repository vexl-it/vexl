import {
  type ListingType,
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
import {Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Help from '../../../Help'
import Info from '../../../Info'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../../LocationSearch/molecule'
import Tabs from '../../../Tabs'
import anonymousCounterpartSvg from '../../../images/anonymousCounterpartSvg'
import AddCityOrDistrict from '../AddCityOrDistrict'
import LocationsList from '../LocationsList'
import SelectLocationFlowModal from './components/SelectLocationFlowModal'
import useContent from './useContent'

interface Props {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
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
  listingTypeAtom,
  locationAtom,
  locationStateAtom,
  updateLocationStatePaymentMethodAtom,
  randomizeLocation,
}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const content = useContent()

  const listingType = useAtomValue(listingTypeAtom)
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
      {(!listingType || listingType === 'BITCOIN') && (
        <Tabs
          activeTab={locationState}
          onTabPress={onLocationStateChange}
          tabs={content}
        />
      )}
      {(locationState === 'IN_PERSON' || listingType === 'OTHER') && (
        <YStack space="$2">
          {!!(!location || (location && location.length < 3)) && (
            <AddCityOrDistrict
              onPress={() => {
                setLocationSearchVisible(newLocationSessionId())
              }}
            />
          )}
          <LocationsList
            locations={location}
            onLocationRemove={onLocationRemove}
          />
        </YStack>
      )}
      {listingType === 'BITCOIN' && locationState === 'ONLINE' && (
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
