import {
  StackActions,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type RootStackParamsList} from '../../../navigationTypes'
import randomlyShiftLatLong from '../../../utils/randomlyShiftMapValueWithRadius'
import LocationRadiusPicker from '../../LocationPicker/LocationRadiusPicker'
import {LocationPickerMolecule} from '../../LocationPicker/molecule'
import {pickedLocationToOfferLocation} from '../../LocationPicker/utils'
import {type MapValueWithRadius} from '../../Map/brands'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

export default function OfferLocationRadiusScreen(): React.ReactElement {
  const navigation = useNavigation()
  const route =
    useRoute<RouteProp<RootStackParamsList, 'OfferLocationRadius'>>()
  const randomizeLocation = route.params?.randomizeLocation ?? false

  const {locationAtom} = useMolecule(offerFormMolecule)
  const setLocation = useSetAtom(locationAtom)
  const {resetLocationPickerActionAtom} = useMolecule(LocationPickerMolecule)
  const resetLocationPicker = useSetAtom(resetLocationPickerActionAtom)

  const handleConfirm = useCallback(
    (pickedLocation: MapValueWithRadius) => {
      const latLongToUse = randomizeLocation
        ? randomlyShiftLatLong({
            latlong: pickedLocation,
            maxMeters: 100,
          })
        : {
            latitude: pickedLocation.latitude,
            longitude: pickedLocation.longitude,
          }

      const newLocation = pickedLocationToOfferLocation({
        pickedLocation,
        latitude: latLongToUse.latitude,
        longitude: latLongToUse.longitude,
      })

      setLocation((prev) => [
        ...(prev
          ? prev.filter((one) => one.placeId !== pickedLocation.placeId)
          : []),
        newLocation,
      ])
      resetLocationPicker()
      navigation.dispatch(StackActions.pop(2))
    },
    [navigation, randomizeLocation, resetLocationPicker, setLocation]
  )

  return <LocationRadiusPicker onConfirm={handleConfirm} />
}
