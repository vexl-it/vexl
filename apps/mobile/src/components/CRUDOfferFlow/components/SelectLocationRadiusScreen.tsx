import {StackActions, useNavigation, useRoute} from '@react-navigation/native'
import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {
  NavigationBar,
  RadiusSlider,
  Typography,
  Button as UiButton,
} from '@vexl-next/ui'
import {ChevronLeft} from '@vexl-next/ui/src/icons'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useRef, useState} from 'react'
import type MapView from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import randomlyShiftLatLong from '../../../utils/randomlyShiftMapValueWithRadius'
import {type MapValueWithRadius} from '../../Map/brands'
import MapLocationWithRadiusSelect from '../../Map/components/MapLocationWithRadiusSelect'
import {pragueCenterLocation} from '../../Map/utils/pragueCenterLocation'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

const MIN_ZOOM = 7
const MAX_ZOOM = 16

export default function SelectLocationRadiusScreen(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  const params = (route.params ?? {}) as {
    randomizeLocation?: boolean
  }
  const randomizeLocation = params.randomizeLocation ?? false

  const {locationAtom, selectedMapValueAtom} = useMolecule(offerFormMolecule)
  const setLocation = useSetAtom(locationAtom)
  const selectedMapValue = useAtomValue(selectedMapValueAtom)
  const initialValue = selectedMapValue ?? pragueCenterLocation
  const mapRef = useRef<MapView>(null)

  const [pickedLocation, setPickedLocation] =
    useState<MapValueWithRadius | null>(null)

  const [zoom, setZoom] = useState((MIN_ZOOM + MAX_ZOOM) / 2)

  const handleZoomChange = useCallback((value: number) => {
    setZoom(value)
    mapRef.current?.setCamera({zoom: value})
  }, [])

  const handleConfirm = useCallback(() => {
    if (!pickedLocation) return

    const latLongToUse = (() => {
      if (!randomizeLocation) {
        return {
          latitude: pickedLocation.latitude,
          longitude: pickedLocation.longitude,
        }
      }
      return randomlyShiftLatLong({
        latlong: pickedLocation,
        maxMeters: 100,
      })
    })()

    const newLocation = {
      placeId: pickedLocation.placeId,
      address: pickedLocation.address,
      shortAddress: pickedLocation.address,
      radius: pickedLocation.radius,
      ...latLongToUse,
    } satisfies OfferLocation

    setLocation((prev) => [
      ...(prev
        ? prev.filter((one) => one.placeId !== pickedLocation.placeId)
        : []),
      newLocation,
    ])
    navigation.dispatch(StackActions.pop(2))
  }, [pickedLocation, randomizeLocation, setLocation, navigation])

  const insets = useSafeAreaInsets()

  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      <YStack backgroundColor="$backgroundSecondary" paddingTop={insets.top}>
        <NavigationBar
          style="back"
          title={t('offerForm.setLocation')}
          leftAction={{
            icon: ChevronLeft,
            onPress: () => {
              navigation.goBack()
            },
          }}
        />
        <Stack height={1} backgroundColor="$backgroundPrimary" />
        <XStack paddingHorizontal="$5" paddingVertical="$5" alignItems="center">
          <Typography
            variant="micro"
            color="$foregroundPrimary"
            textAlign="center"
            flex={1}
          >
            {t('offerForm.location.setAreaDescription')}
          </Typography>
        </XStack>
      </YStack>

      <Stack flex={1}>
        <MapLocationWithRadiusSelect
          initialValue={initialValue}
          onPick={setPickedLocation}
          hideSlider
          mapRef={mapRef}
        />

        <Stack position="absolute" bottom="$8" left="$3" right="$3">
          <YStack
            backgroundColor="$backgroundPrimary"
            borderRadius="$7"
            padding="$3"
            gap="$3"
          >
            <XStack paddingHorizontal="$2" paddingVertical="$3">
              <Typography
                variant="paragraphDemibold"
                color="$foregroundPrimary"
              >
                {t('offerForm.location.changeRadius')}
              </Typography>
            </XStack>
            <Stack paddingHorizontal="$5">
              <RadiusSlider
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                value={zoom}
                onValueChange={handleZoomChange}
                step={1}
              />
            </Stack>
            <UiButton variant="primary" size="large" onPress={handleConfirm}>
              {t('common.confirm')}
            </UiButton>
          </YStack>
        </Stack>
      </Stack>
    </YStack>
  )
}
