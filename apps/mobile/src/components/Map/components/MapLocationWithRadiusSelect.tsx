import {
  Latitude,
  Longitude,
  Radius,
  longitudeDeltaToKilometers,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  RadiusSlider,
  Stack,
  Typography,
  tokens,
  useTheme,
  useVexlTheme,
} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {StyleSheet, type LayoutChangeEvent} from 'react-native'
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {apiAtom} from '../../../api'
import {createEffectAtomWithProgress} from '../../../utils/atomUtils/createEffectAtomWithProgress'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {type MapValue, type MapValueWithRadius} from '../brands'
import {getMapTheme} from '../utils/mapStyle'
import mapValueToRegion from '../utils/mapValueToRegion'
import {
  calculateAvailableSelectionFrame,
  calculateLongitudeRadiusDelta,
  calculateRingDiameter,
} from './MapLocationWithRadiusSelect.geometry'
import {MapPinAsset, RadiusRingAsset} from './MapSvgAssets'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  onPick: (place: MapValueWithRadius | null) => void
  hideSlider?: boolean
  mapRef: React.RefObject<MapView | null>
}

const circleMargin = tokens.space[2].val

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
})

const MIN_ZOOM = 7
const MAX_ZOOM = 16

interface SelectedMapState {
  center: {
    latitude: number
    longitude: number
  }
  radius: number
}

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(value, MAX_ZOOM))
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialSelectedMapState,
  onPick,
}: {
  onPick: (place: MapValueWithRadius | null) => void
  initialSelectedMapState: SelectedMapState
}) {
  return useMemo(() => {
    const {
      effectiveInputAtom: selectedMapStateAtom,
      resultAtom: getGeocodedRegionAtom,
    } = createEffectAtomWithProgress({
      inputAtom: atom(initialSelectedMapState),
      effectToRun: (selectedMapState, get) =>
        get(apiAtom)
          .location.getGeocodedCoordinates({
            lang: getCurrentLocale(),
            latitude: Schema.decodeSync(Latitude)(
              selectedMapState.center.latitude
            ),
            longitude: Schema.decodeSync(Longitude)(
              selectedMapState.center.longitude
            ),
          })
          .pipe(
            Effect.tap((data) => {
              onPick({
                ...data,
                latitude: Schema.decodeSync(Latitude)(
                  selectedMapState.center.latitude
                ),
                longitude: Schema.decodeSync(Longitude)(
                  selectedMapState.center.longitude
                ),
                radius: Schema.decodeSync(Radius)(selectedMapState.radius),
              })
              return data
            })
          ),
    })

    return {
      selectedMapStateAtom,
      selectedRegionRadiusAtom: atom<string>((get) => {
        const selectedMapState = get(selectedMapStateAtom)
        return Intl.NumberFormat(getCurrentLocale()).format(
          Math.round(
            longitudeDeltaToKilometers(
              selectedMapState.radius,
              Schema.decodeSync(Latitude)(selectedMapState.center.latitude)
            ) * 10
          ) / 10
        )
      }),
      getGeocodedRegionAtom,
    }
  }, [initialSelectedMapState, onPick])
}

function PickedLocationText({
  selectedRegionRadiusAtom,
  geocodedRegionAtom,
}: {
  geocodedRegionAtom: ReturnType<typeof useAtoms>['getGeocodedRegionAtom']
  selectedRegionRadiusAtom: ReturnType<
    typeof useAtoms
  >['selectedRegionRadiusAtom']
}): React.ReactElement {
  const geocodingState = useAtomValue(geocodedRegionAtom)
  const {t} = useTranslation()
  const radius = useAtomValue(selectedRegionRadiusAtom)

  return geocodingState.state !== 'done' ? (
    <Typography variant="micro" color="$foregroundPrimary">
      {t('common.loading')}...
    </Typography>
  ) : (
    <React.Fragment>
      <Typography
        variant="micro"
        textAlign="center"
        color={
          E.isLeft(geocodingState.result)
            ? '$redForeground'
            : '$foregroundPrimary'
        }
      >
        {pipe(
          geocodingState.result,
          E.match(
            (l) =>
              toCommonErrorMessage(l, t) ?? t('map.location.errors.notFound'),
            (data) => data?.address ?? t('map.locationSelect.hint')
          )
        )}
      </Typography>
      <Typography
        variant="micro"
        textAlign="center"
        color={
          E.isLeft(geocodingState.result)
            ? '$redForeground'
            : '$foregroundPrimary'
        }
      >
        {t('map.locationSelect.radius', {
          radius,
        })}
      </Typography>
    </React.Fragment>
  )
}

export function calculateZoom(
  latitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
  minDelta = 0.001,
  maxDelta = 50
): number {
  // Adjust longitudeDelta based on latitude
  const adjustedLongitudeDelta =
    longitudeDelta * Math.cos((latitude * Math.PI) / 180)

  // Determine the effective delta
  const effectiveDelta = Math.max(latitudeDelta, adjustedLongitudeDelta)

  // Clamp the delta within minDelta and maxDelta
  const clampedDelta = Math.max(minDelta, Math.min(effectiveDelta, maxDelta))

  // Normalize and calculate zoom
  const zoom = 99 - ((clampedDelta - minDelta) / (maxDelta - minDelta)) * 99

  return Math.round(zoom) // Round to nearest integer
}

export default function MapLocationWithRadiusSelect({
  onPick,
  initialValue,
  topChildren,
  bottomChildren,
  hideSlider,
  mapRef,
  ...restProps
}: Props): React.ReactElement {
  const safeAreaInsets = useSafeAreaInsets()
  const {resolvedTheme} = useVexlTheme()
  const theme = useTheme()
  const accentHighlightSecondary = theme.accentHighlightSecondary.get()
  const backgroundPrimary = theme.backgroundPrimary.get()
  const initialRegion = useMemo(
    () => mapValueToRegion(initialValue),
    [initialValue]
  )

  const initialZoom = useMemo(
    () =>
      clampZoom(
        calculateZoom(
          initialRegion.latitude,
          initialRegion.latitudeDelta,
          initialRegion.longitudeDelta
        )
      ),
    [initialRegion]
  )
  const [zoom, setZoom] = useState(initialZoom)
  const initialSelectedMapState = useMemo(
    () => ({
      center: {
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
      },
      radius: Math.abs(initialRegion.longitudeDelta) / 2,
    }),
    [initialRegion]
  )
  const [containerSize, setContainerSize] = useState({width: 0, height: 0})
  const [topOverlayHeight, setTopOverlayHeight] = useState(0)
  const [bottomOverlayHeight, setBottomOverlayHeight] = useState(0)

  const overlayInsets = useMemo(
    () => ({
      top: safeAreaInsets.top + topOverlayHeight,
      bottom: safeAreaInsets.bottom + bottomOverlayHeight,
      left: safeAreaInsets.left,
      right: safeAreaInsets.right,
    }),
    [
      bottomOverlayHeight,
      safeAreaInsets.bottom,
      safeAreaInsets.left,
      safeAreaInsets.right,
      safeAreaInsets.top,
      topOverlayHeight,
    ]
  )

  const selectionFrame = useMemo(
    () =>
      calculateAvailableSelectionFrame({
        container: containerSize,
        overlays: overlayInsets,
      }),
    [containerSize, overlayInsets]
  )
  const ringDiameter = useMemo(
    () => calculateRingDiameter({frame: selectionFrame, margin: circleMargin}),
    [selectionFrame]
  )

  useEffect(() => {
    setZoom(initialZoom)
  }, [initialZoom])

  const atoms = useAtoms({
    initialSelectedMapState,
    onPick,
  })
  const setSelectedMapState = useSetAtom(atoms.selectedMapStateAtom)
  const handleZoomChange = useCallback(
    (value: number) => {
      setZoom(value)
      mapRef.current?.setCamera({
        zoom: value,
      })
    },
    [mapRef]
  )
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout

    setContainerSize({
      width,
      height,
    })
  }, [])
  const handleTopOverlayLayout = useCallback((event: LayoutChangeEvent) => {
    setTopOverlayHeight(Math.ceil(event.nativeEvent.layout.height))
  }, [])
  const handleBottomOverlayLayout = useCallback((event: LayoutChangeEvent) => {
    setBottomOverlayHeight(Math.ceil(event.nativeEvent.layout.height))
  }, [])
  const handleRegionChangeComplete = useCallback(() => {
    if (ringDiameter <= 0) return

    const map = mapRef.current
    if (!map) return

    const centerPoint = {
      x: selectionFrame.centerX,
      y: selectionFrame.centerY,
    }
    const radiusPoint = {
      x: selectionFrame.centerX + ringDiameter / 2,
      y: selectionFrame.centerY,
    }

    void Promise.all([
      map.coordinateForPoint(centerPoint),
      map.coordinateForPoint(radiusPoint),
    ]).then(([centerCoordinate, radiusCoordinate]) => {
      setSelectedMapState({
        center: {
          latitude: centerCoordinate.latitude,
          longitude: centerCoordinate.longitude,
        },
        radius: calculateLongitudeRadiusDelta({
          centerLongitude: centerCoordinate.longitude,
          edgeLongitude: radiusCoordinate.longitude,
        }),
      })
    })
  }, [mapRef, ringDiameter, selectionFrame, setSelectedMapState])

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
      onLayout={handleContainerLayout}
    >
      <MapView
        ref={mapRef}
        mapPadding={overlayInsets}
        provider={PROVIDER_GOOGLE}
        customMapStyle={getMapTheme(resolvedTheme)}
        style={[styles.map, {backgroundColor: backgroundPrimary}]}
        toolbarEnabled={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        region={initialRegion}
      />
      <Stack
        pointerEvents="none"
        position="absolute"
        top={selectionFrame.centerY}
        left={selectionFrame.centerX}
        transform={[{translateX: -70 / 2}, {translateY: (-70 / 3) * 2}]}
      >
        <MapPinAsset color={accentHighlightSecondary} />
      </Stack>

      <Stack
        pointerEvents="none"
        position="absolute"
        justifyContent="center"
        alignItems="center"
        top={selectionFrame.centerY - ringDiameter / 2}
        left={selectionFrame.centerX - ringDiameter / 2}
        width={ringDiameter}
        height={ringDiameter}
      >
        <RadiusRingAsset color={accentHighlightSecondary} size="100%" />
      </Stack>

      <Stack
        pointerEvents="none"
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        h="100%"
        w="100%"
      >
        <Stack height={selectionFrame.y + selectionFrame.height / 2}></Stack>
        <Stack p="$2">
          <Stack
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$6"
            alignSelf="center"
            backgroundColor="$backgroundPrimary"
          >
            <PickedLocationText
              geocodedRegionAtom={atoms.getGeocodedRegionAtom}
              selectedRegionRadiusAtom={atoms.selectedRegionRadiusAtom}
            />
          </Stack>
        </Stack>
      </Stack>
      <Stack
        pointerEvents="box-none"
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        h="100%"
        w="100%"
      >
        <Stack
          pointerEvents="box-none"
          flex={1}
          paddingTop={safeAreaInsets.top}
          paddingBottom={safeAreaInsets.bottom}
          paddingLeft={safeAreaInsets.left}
          paddingRight={safeAreaInsets.right}
        >
          <Stack onLayout={handleTopOverlayLayout}>{topChildren}</Stack>
          <Stack pointerEvents="none" flex={1}></Stack>
          <Stack onLayout={handleBottomOverlayLayout}>
            {hideSlider !== true ? (
              <Stack mb="$4" mx="$4">
                <RadiusSlider
                  value={zoom}
                  step={0.2}
                  onValueChange={handleZoomChange}
                  max={MAX_ZOOM}
                  min={MIN_ZOOM}
                />
              </Stack>
            ) : null}
            {bottomChildren}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
