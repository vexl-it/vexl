import {useNavigation} from '@react-navigation/native'
import {RowButton, RowCheckbox} from '@vexl-next/ui'
import {PlusAdd} from '@vexl-next/ui/src/icons'
import {YStack} from '@vexl-next/ui/src/primitives'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
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
  const navigation = useNavigation()
  const location = useAtomValue(locationArrayOfOneAtom)
  const isOnline = useAtomValue(isOnlineFilterAtom)
  const isOnlineVisible = useAtomValue(isOnlineFilterVisibleAtom)
  const removeLocation = useSetAtom(removeOfferLocationActionAtom)
  const updateLocationStateAndPaymentMethod = useSetAtom(
    updateLocationStateAndPaymentMethodAtom
  )

  const handleAddLocation = useCallback(() => {
    navigation.navigate('SelectLocationSearch', {randomizeLocation: false})
  }, [navigation])

  return (
    <YStack gap="$3">
      {!location || location.length < 3 ? (
        <RowButton
          icon={PlusAdd}
          label={t('filterOffers.addLocation')}
          onPress={handleAddLocation}
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
    </YStack>
  )
}

export default LocationSection
