import {
  StackActions,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native'
import {
  type LocationPlaceId,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type RootStackParamsList} from '../../../navigationTypes'
import randomlyShiftLatLong from '../../../utils/randomlyShiftMapValueWithRadius'
import LocationRadiusPicker from '../../LocationPicker/LocationRadiusPicker'
import {LocationPickerMolecule} from '../../LocationPicker/molecule'
import {pickedLocationToOfferLocation} from '../../LocationPicker/utils'
import {type MapValueWithRadius} from '../../Map/brands'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

const CENTER_MOVED_THRESHOLD_DEGREES = 0.0002

function getLocationByPlaceId({
  locations,
  placeId,
}: {
  readonly locations: readonly OfferLocation[]
  readonly placeId: LocationPlaceId | undefined
}): OfferLocation | undefined {
  if (!placeId) return undefined

  return Option.getOrUndefined(
    pipe(
      locations,
      Array.findFirst((one) => one.placeId === placeId)
    )
  )
}

function centerMovedMeaningfully({
  pickedLocation,
  originalLocation,
}: {
  readonly pickedLocation: MapValueWithRadius
  readonly originalLocation: OfferLocation
}): boolean {
  return (
    Math.abs(pickedLocation.latitude - originalLocation.latitude) >
      CENTER_MOVED_THRESHOLD_DEGREES ||
    Math.abs(pickedLocation.longitude - originalLocation.longitude) >
      CENTER_MOVED_THRESHOLD_DEGREES
  )
}

export default function OfferLocationRadiusScreen(): React.ReactElement {
  const navigation = useNavigation()
  const route =
    useRoute<RouteProp<RootStackParamsList, 'OfferLocationRadius'>>()
  const randomizeLocation = route.params?.randomizeLocation ?? false
  const editingLocationPlaceId = route.params?.editingLocationPlaceId

  const {locationAtom} = useMolecule(offerFormMolecule)
  const setLocation = useSetAtom(locationAtom)
  const {resetLocationPickerActionAtom} = useMolecule(LocationPickerMolecule)
  const resetLocationPicker = useSetAtom(resetLocationPickerActionAtom)

  const handleConfirm = useCallback(
    (pickedLocation: MapValueWithRadius) => {
      setLocation((prev) => {
        const currentLocations = prev ?? []
        const originalLocation = getLocationByPlaceId({
          locations: currentLocations,
          placeId: editingLocationPlaceId,
        })

        const latLongToUse =
          originalLocation &&
          !centerMovedMeaningfully({pickedLocation, originalLocation})
            ? {
                latitude: originalLocation.latitude,
                longitude: originalLocation.longitude,
              }
            : randomizeLocation
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

        if (editingLocationPlaceId && originalLocation) {
          return pipe(
            currentLocations,
            Array.filter(
              (one) =>
                one.placeId !== pickedLocation.placeId ||
                one.placeId === editingLocationPlaceId
            ),
            Array.map((one) =>
              one.placeId === editingLocationPlaceId ? newLocation : one
            )
          )
        }

        return [
          ...pipe(
            currentLocations,
            Array.filter((one) => one.placeId !== pickedLocation.placeId)
          ),
          newLocation,
        ]
      })
      resetLocationPicker()
      if (editingLocationPlaceId) {
        navigation.goBack()
      } else {
        navigation.dispatch(StackActions.pop(2))
      }
    },
    [
      editingLocationPlaceId,
      navigation,
      randomizeLocation,
      resetLocationPicker,
      setLocation,
    ]
  )

  return <LocationRadiusPicker onConfirm={handleConfirm} />
}
