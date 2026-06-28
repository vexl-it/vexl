import {useNavigation} from '@react-navigation/native'
import {Button, NavigationBar, Typography} from '@vexl-next/ui'
import {ChevronLeft} from '@vexl-next/ui/src/icons'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import type MapView from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type MapValueWithRadius} from '../Map/brands'
import MapLocationWithRadiusSelect from '../Map/components/MapLocationWithRadiusSelect'
import PinchZoomHint from '../Map/components/PinchZoomHint'
import {pragueCenterLocation} from '../Map/utils/pragueCenterLocation'
import {LocationPickerMolecule} from './molecule'

const PINCH_HINT_VISIBLE_MS = 3000

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
  const mapRef = useRef<MapView>(null)

  const [pickedLocation, setPickedLocation] =
    useState<MapValueWithRadius | null>(null)
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
  }, [])

  const handleConfirm = useCallback(() => {
    if (!pickedLocation) return
    onConfirm(pickedLocation)
  }, [onConfirm, pickedLocation])

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
            {t('offerForm.location.meetingAreaDescription')}
          </Typography>
        </XStack>
      </YStack>

      <Stack flex={1}>
        <MapLocationWithRadiusSelect
          initialValue={initialValue}
          onPick={handlePick}
          mapRef={mapRef}
          onMapGesture={handleMapGesture}
          bottomChildren={
            <Stack paddingBottom="$4" paddingHorizontal="$3">
              <Button variant="primary" size="large" onPress={handleConfirm}>
                {t('common.confirm')}
              </Button>
            </Stack>
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
