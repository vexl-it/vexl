import {RowButton, RowCheckbox} from '@vexl-next/ui'
import {PlusAdd} from '@vexl-next/ui/src/icons'
import {YStack} from '@vexl-next/ui/src/primitives'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../LocationSearch/molecule'
import SelectLocationFlowModal from '../../OfferForm/components/Location/components/SelectLocationFlowModal'
import LocationsList from '../../OfferForm/components/LocationsList'
import {
  isOnlineFilterAtom,
  isOnlineFilterVisibleAtom,
  locationArrayOfOneAtom,
  removeOfferLocationActionAtom,
  updateLocationStateAndPaymentMethodAtom,
} from '../atom'

function LocationSection(): React.ReactElement {
  const {t} = useTranslation()
  const location = useAtomValue(locationArrayOfOneAtom)
  const isOnline = useAtomValue(isOnlineFilterAtom)
  const isOnlineVisible = useAtomValue(isOnlineFilterVisibleAtom)
  const removeLocation = useSetAtom(removeOfferLocationActionAtom)
  const updateLocationStateAndPaymentMethod = useSetAtom(
    updateLocationStateAndPaymentMethodAtom
  )

  const [locationSearchVisible, setLocationSearchVisible] =
    useState<LocationSessionId | null>(null)

  return (
    <YStack gap="$3">
      {!location || location.length < 3 ? (
        <RowButton
          icon={PlusAdd}
          label={t('filterOffers.addLocation')}
          onPress={() => {
            setLocationSearchVisible(newLocationSessionId())
          }}
        />
      ) : null}
      <LocationsList locations={location} onLocationRemove={removeLocation} />
      {isOnlineVisible ? (
        <RowCheckbox
          label={t('filterOffers.onlineOffers')}
          checked={isOnline}
          onCheckedChange={() => {
            updateLocationStateAndPaymentMethod('ONLINE')
          }}
        />
      ) : null}
      <SelectLocationFlowModal
        randomizeLocation={false}
        locationSessionId={locationSearchVisible ?? newLocationSessionId()}
        locationAtom={locationArrayOfOneAtom}
        onSetVisible={(visible) => {
          if (visible) setLocationSearchVisible(newLocationSessionId())
          else setLocationSearchVisible(null)
        }}
        visible={!!locationSearchVisible}
      />
    </YStack>
  )
}

export default LocationSection
