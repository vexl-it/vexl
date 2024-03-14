import {
  type DeliveryMethod,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {useState} from 'react'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Info from '../../Info'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../LocationSearch/molecule'
import SelectableCell from '../../SelectableCell'
import AddCityOrDistrict from './AddCityOrDistrict'
import SelectLocationFlowModal from './Location/components/SelectLocationFlowModal'
import LocationsList from './LocationsList'

interface Props {
  changeDeliveryMethodActionAtom: WritableAtom<
    null,
    [deliveryMethod: DeliveryMethod],
    void
  >
  deliveryMethodAtom: PrimitiveAtom<DeliveryMethod[]>
  locationAtom: PrimitiveAtom<OfferLocation[] | undefined>
  randomizeLocation: boolean
}

function DeliveryMethodComponent({
  changeDeliveryMethodActionAtom,
  deliveryMethodAtom,
  locationAtom,
  randomizeLocation,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const [locations, setLocations] = useAtom(locationAtom)
  const deliveryMethod = useAtomValue(deliveryMethodAtom)
  const changeDeliveryMethod = useSetAtom(changeDeliveryMethodActionAtom)

  const [locationSearchVisible, setLocationSearchVisible] =
    useState<LocationSessionId | null>(null)

  const onLocationRemove = (locationToRemove: OfferLocation): void => {
    const filteredLocation = locations?.filter(
      (loc) => loc.placeId !== locationToRemove.placeId
    )
    if (filteredLocation) setLocations(filteredLocation)
  }

  return (
    <YStack space="$5">
      <YStack space="$2">
        <SelectableCell
          selected={deliveryMethod.includes('PICKUP')}
          onPress={() => {
            changeDeliveryMethod('PICKUP')
          }}
          title={t('offerForm.pickup')}
          subtitle={t('offerForm.pickupDescription')}
          type="PICKUP"
        />
        {deliveryMethod.includes('PICKUP') && (
          <YStack space="$1">
            {!!(!locations || (locations && locations.length < 3)) && (
              <AddCityOrDistrict
                onPress={() => {
                  setLocationSearchVisible(newLocationSessionId())
                }}
              />
            )}
            <LocationsList
              locations={locations}
              onLocationRemove={onLocationRemove}
            />
          </YStack>
        )}
      </YStack>
      <YStack space="$2">
        <SelectableCell
          selected={deliveryMethod.includes('DELIVERY')}
          onPress={() => {
            changeDeliveryMethod('DELIVERY')
          }}
          title={t('offerForm.delivery')}
          subtitle={t('offerForm.deliveryDescription')}
          type="DELIVERY"
        />
        {deliveryMethod.includes('DELIVERY') && (
          <Info text={t('offerForm.pickupDeliveryIsSafer')} />
        )}
      </YStack>
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
    </YStack>
  )
}

export default DeliveryMethodComponent
