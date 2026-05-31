import {useNavigation} from '@react-navigation/native'
import {Button, NavigationBar, RadiusSlider, Typography} from '@vexl-next/ui'
import {ChevronLeft} from '@vexl-next/ui/src/icons'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import type MapView from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type MapValueWithRadius} from '../Map/brands'
import MapLocationWithRadiusSelect from '../Map/components/MapLocationWithRadiusSelect'
import {
  calculateNormalizedSliderValueFromZoom,
  calculateZoomFromLongitudeDelta,
  calculateZoomFromNormalizedSliderValue,
} from '../Map/components/MapLocationWithRadiusSelect.geometry'
import mapValueToRegion from '../Map/utils/mapValueToRegion'
import {pragueCenterLocation} from '../Map/utils/pragueCenterLocation'
import {LocationPickerMolecule} from './molecule'

const MIN_ZOOM = 0
const MAX_ZOOM = 20
const SLIDER_MIN = 0
const SLIDER_CENTER = 0.5
const SLIDER_MAX = 1
const MAX_ZOOM_OUT_FROM_INITIAL = 0.8
const MAX_ZOOM_IN_FROM_INITIAL = 6

interface Props {
  readonly onConfirm: (pickedLocation: MapValueWithRadius) => void
}

export default function LocationRadiusPicker({
  onConfirm,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {selectedMapValueAtom} = useMolecule(LocationPickerMolecule)
  const selectedMapValue = useAtomValue(selectedMapValueAtom)
  const initialValue = selectedMapValue ?? pragueCenterLocation
  const {width: windowWidth} = useWindowDimensions()
  const initialRegion = useMemo(
    () => mapValueToRegion(initialValue),
    [initialValue]
  )
  const initialZoom = useMemo(
    () =>
      calculateZoomFromLongitudeDelta({
        longitudeDelta: initialRegion.longitudeDelta,
        mapWidth: windowWidth,
      }),
    [initialRegion.longitudeDelta, windowWidth]
  )
  const mapRef = useRef<MapView>(null)

  const [pickedLocation, setPickedLocation] =
    useState<MapValueWithRadius | null>(null)
  const selectedCenterRef = useRef({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  })

  const [sliderValue, setSliderValue] = useState(SLIDER_CENTER)

  useEffect(() => {
    setSliderValue(SLIDER_CENTER)
    selectedCenterRef.current = {
      latitude: initialRegion.latitude,
      longitude: initialRegion.longitude,
    }
  }, [initialRegion.latitude, initialRegion.longitude])

  const handlePick = useCallback((location: MapValueWithRadius | null) => {
    setPickedLocation(location)

    if (location) {
      selectedCenterRef.current = {
        latitude: location.latitude,
        longitude: location.longitude,
      }
    }
  }, [])

  const handleSliderValueChange = useCallback(
    (value: number) => {
      setSliderValue(value)
      mapRef.current?.setCamera({
        center: selectedCenterRef.current,
        zoom: calculateZoomFromNormalizedSliderValue({
          sliderValue: value,
          initialZoom,
          zoomOut: MAX_ZOOM_OUT_FROM_INITIAL,
          zoomIn: MAX_ZOOM_IN_FROM_INITIAL,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        }),
      })
    },
    [initialZoom]
  )

  const handleMapZoomChange = useCallback(
    (zoom: number) => {
      setSliderValue(
        calculateNormalizedSliderValueFromZoom({
          zoom,
          initialZoom,
          zoomOut: MAX_ZOOM_OUT_FROM_INITIAL,
          zoomIn: MAX_ZOOM_IN_FROM_INITIAL,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        })
      )
    },
    [initialZoom]
  )

  const handleConfirm = useCallback(() => {
    if (!pickedLocation) return
    onConfirm(pickedLocation)
  }, [onConfirm, pickedLocation])

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
            {t('offerForm.location.meetingAreaDescription')}
          </Typography>
        </XStack>
      </YStack>

      <Stack flex={1}>
        <MapLocationWithRadiusSelect
          initialValue={initialValue}
          onPick={handlePick}
          hideSlider
          mapRef={mapRef}
          onMapZoomChange={handleMapZoomChange}
          bottomChildren={
            <Stack paddingBottom="$8" paddingHorizontal="$3">
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
                    {t('offerForm.location.setMeetingArea')}
                  </Typography>
                </XStack>
                <Stack paddingHorizontal="$5">
                  <RadiusSlider
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    value={sliderValue}
                    onValueChange={handleSliderValueChange}
                    step={0.01}
                  />
                </Stack>
                <Button variant="primary" size="large" onPress={handleConfirm}>
                  {t('common.confirm')}
                </Button>
              </YStack>
            </Stack>
          }
        />
      </Stack>
    </YStack>
  )
}
