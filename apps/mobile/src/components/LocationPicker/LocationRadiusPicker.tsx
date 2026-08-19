import {useNavigation} from '@react-navigation/native'
import {calculateViewportRadius} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Button, NavigationBar, TextField, Typography} from '@vexl-next/ui'
import {ChevronLeft} from '@vexl-next/ui/src/icons'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useMolecule} from 'bunshi/dist/react'
import {atom, useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type MapValueWithRadius} from '../Map/brands'
import MapLocationWithRadiusSelect, {
  type SelectedCoordinates,
} from '../Map/components/MapLocationWithRadiusSelect'
import PinchZoomHint from '../Map/components/PinchZoomHint'
import {type GeocodingFailureKind} from '../Map/types'
import {pragueCenterLocation} from '../Map/utils/pragueCenterLocation'
import {LocationPickerMolecule} from './molecule'
import {
  isManualLocationPlaceId,
  manualAddressToMapValueWithRadius,
} from './utils'

const PINCH_HINT_VISIBLE_MS = 3000
const MANUAL_ADDRESS_MAX_LENGTH = 40

interface Props {
  readonly onConfirm: (pickedLocation: MapValueWithRadius) => void
  readonly variant: 'offer' | 'filter'
}

export default function LocationRadiusPicker({
  onConfirm,
  variant,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {selectedMapValueAtom, isLocationServiceDownAtom} = useMolecule(
    LocationPickerMolecule
  )
  const selectedMapValue = useAtomValue(selectedMapValueAtom)
  const isLocationServiceDown = useAtomValue(isLocationServiceDownAtom)
  const initialValue = selectedMapValue ?? pragueCenterLocation
  const isEditingManualLocation =
    selectedMapValue != null &&
    isManualLocationPlaceId(selectedMapValue.placeId)

  // Both the address and the fallback visibility are local to this picker
  // session so nothing leaks into the next one. Editing a manually entered
  // location seeds the input with its address instead of an empty placeholder.
  const [manualAddressAtom] = useState(() =>
    atom(isEditingManualLocation ? selectedMapValue.address : '')
  )
  const [showManualAddressInput, setShowManualAddressInput] = useState(
    () => isLocationServiceDown || isEditingManualLocation
  )
  const manualAddress = useAtomValue(manualAddressAtom)
    .replace(/\s+/g, ' ')
    .trim()

  const [pickedLocation, setPickedLocation] =
    useState<MapValueWithRadius | null>(null)
  const [coordinates, setCoordinates] = useState<SelectedCoordinates>(() => ({
    latitude: initialValue.latitude,
    longitude: initialValue.longitude,
    radius: calculateViewportRadius(initialValue.viewport),
  }))
  const [isPinchHintMounted, setIsPinchHintMounted] = useState(true)
  const [isPinchHintVisible, setIsPinchHintVisible] = useState(true)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsPinchHintVisible(false)
    }, PINCH_HINT_VISIBLE_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  const handlePick = useCallback((location: MapValueWithRadius | null) => {
    setPickedLocation(location)
    if (location) setShowManualAddressInput(false)
  }, [])

  // A notFound result means the service responded fine, so it does not newly
  // show the fallback on its own — but it never hides an input that is already
  // visible (e.g. the user typed an address, then moved the pin somewhere not
  // in the geocoding DB). A successful geocode still hides it via handlePick.
  const handleGeocodingFailed = useCallback(
    (kind: GeocodingFailureKind) => {
      setShowManualAddressInput(
        (prev) => prev || kind === 'serviceError' || isEditingManualLocation
      )
    },
    [isEditingManualLocation]
  )

  const canConfirm =
    pickedLocation != null ||
    (showManualAddressInput && (variant === 'filter' || manualAddress !== ''))

  const handleConfirm = useCallback(() => {
    if (pickedLocation) {
      onConfirm(pickedLocation)
      return
    }

    if (!showManualAddressInput) return

    const address =
      manualAddress !== ''
        ? manualAddress
        : variant === 'filter'
          ? t('filterOffers.location.mapAreaLabel', {
              latitude: coordinates.latitude.toFixed(1),
              longitude: coordinates.longitude.toFixed(1),
            })
          : null

    if (address == null) return

    onConfirm(
      manualAddressToMapValueWithRadius({
        address,
        ...coordinates,
      })
    )
  }, [
    coordinates,
    manualAddress,
    onConfirm,
    pickedLocation,
    showManualAddressInput,
    t,
    variant,
  ])

  const handleMapGesture = useCallback(() => {
    setIsPinchHintVisible(false)
  }, [])

  const handlePinchHintHidden = useCallback(() => {
    setIsPinchHintMounted(false)
  }, [])

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
            {t(
              variant === 'filter'
                ? 'filterOffers.location.areaDescription'
                : 'offerForm.location.meetingAreaDescription'
            )}
          </Typography>
        </XStack>
      </YStack>

      <Stack flex={1}>
        <MapLocationWithRadiusSelect
          initialValue={initialValue}
          onPick={handlePick}
          onGeocodingFailed={handleGeocodingFailed}
          onCoordinatesChange={setCoordinates}
          onMapGesture={handleMapGesture}
          serviceErrorMessage={
            variant === 'filter'
              ? t('filterOffers.location.serviceError')
              : undefined
          }
          bottomChildren={
            <YStack gap="$3" paddingBottom="$4" paddingHorizontal="$3">
              {showManualAddressInput ? (
                <YStack
                  backgroundColor="$backgroundPrimary"
                  borderRadius="$6"
                  padding="$4"
                  gap="$3"
                >
                  <Typography variant="micro" color="$foregroundSecondary">
                    {t(
                      variant === 'filter'
                        ? 'filterOffers.location.manualLabelDescription'
                        : 'map.location.manualAddress.description'
                    )}
                  </Typography>
                  <TextField
                    valueAtom={manualAddressAtom}
                    placeholder={t('map.location.manualAddress.placeholder')}
                    maxLength={MANUAL_ADDRESS_MAX_LENGTH}
                    showClear
                  />
                </YStack>
              ) : null}
              <Button
                variant="primary"
                size="large"
                disabled={!canConfirm}
                onPress={handleConfirm}
              >
                {t('common.confirm')}
              </Button>
            </YStack>
          }
        />
        {isPinchHintMounted ? (
          <Stack
            pointerEvents="none"
            position="absolute"
            top="$5"
            left={0}
            right={0}
            alignItems="center"
            paddingHorizontal="$5"
          >
            <PinchZoomHint
              visible={isPinchHintVisible}
              onHidden={handlePinchHintHidden}
            />
          </Stack>
        ) : null}
      </Stack>
    </YStack>
  )
}
