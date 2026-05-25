import {StackActions, useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import LocationRadiusPicker from '../../LocationPicker/LocationRadiusPicker'
import {LocationPickerMolecule} from '../../LocationPicker/molecule'
import {pickedLocationToOfferLocation} from '../../LocationPicker/utils'
import {type MapValueWithRadius} from '../../Map/brands'
import {locationArrayOfOneAtom} from '../atom'

export default function FilterLocationRadiusScreen(): React.ReactElement {
  const navigation = useNavigation()
  const setFilterLocation = useSetAtom(locationArrayOfOneAtom)
  const {resetLocationPickerActionAtom} = useMolecule(LocationPickerMolecule)
  const resetLocationPicker = useSetAtom(resetLocationPickerActionAtom)

  const handleConfirm = useCallback(
    (pickedLocation: MapValueWithRadius) => {
      const newLocation = pickedLocationToOfferLocation({
        pickedLocation,
        latitude: pickedLocation.latitude,
        longitude: pickedLocation.longitude,
      })

      setFilterLocation((prev) => [
        ...(prev
          ? prev.filter((one) => one.placeId !== pickedLocation.placeId)
          : []),
        newLocation,
      ])
      resetLocationPicker()
      navigation.dispatch(StackActions.pop(2))
    },
    [navigation, resetLocationPicker, setFilterLocation]
  )

  return <LocationRadiusPicker onConfirm={handleConfirm} />
}
