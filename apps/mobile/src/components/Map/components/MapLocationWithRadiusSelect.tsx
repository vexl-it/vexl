import {
  Camera,
  type MapRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native'
import {
  Latitude,
  Longitude,
  Radius,
  longitudeDeltaToKilometers,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  KeyboardStickyView,
  Stack,
  Typography,
  tokens,
  useTheme,
} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {type LayoutChangeEvent, type NativeSyntheticEvent} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {apiAtom} from '../../../api'
import {createEffectAtomWithProgress} from '../../../utils/atomUtils/createEffectAtomWithProgress'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {appLanguageAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {reportLocationServiceError} from '../../../utils/reportLocationServiceError'
import {transientRequestRetryPolicy} from '../../../utils/transientRequestRetryPolicy'
import {type MapValue, type MapValueWithRadius} from '../brands'
import {type GeocodingFailureKind} from '../types'
import {
  getWrappedLongitudeSpan,
  mapValueToBounds,
} from '../utils/mapLibreRegion'
import {
  calculateAvailableSelectionFrame,
  calculateLongitudeRadiusDelta,
  calculateRingDiameter,
} from './MapLocationWithRadiusSelect.geometry'
import {MapPinAsset, RadiusRingAsset} from './MapSvgAssets'
import VexlMap from './VexlMap'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  onPick: (place: MapValueWithRadius | null) => void
  onGeocodingFailed?: (kind: GeocodingFailureKind) => void
  onCoordinatesChange?: (coordinates: SelectedCoordinates) => void
  onMapGesture?: () => void
  readonly serviceErrorMessage?: string
}

export interface SelectedCoordinates {
  readonly latitude: Latitude
  readonly longitude: Longitude
  readonly radius: Radius
}

const circleMargin = tokens.space[2].val

interface SelectedMapState {
  center: {
    latitude: number
    longitude: number
  }
  radius: number
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialSelectedMapState,
  onPick,
  onGeocodingFailed,
  onCoordinatesChange,
}: {
  onPick: (place: MapValueWithRadius | null) => void
  onGeocodingFailed?: (kind: GeocodingFailureKind) => void
  onCoordinatesChange?: (coordinates: SelectedCoordinates) => void
  initialSelectedMapState: SelectedMapState
}) {
  return useMemo(() => {
    const {
      effectiveInputAtom: selectedMapStateAtom,
      resultAtom: getGeocodedRegionAtom,
    } = createEffectAtomWithProgress({
      inputAtom: atom(initialSelectedMapState),
      effectToRun: (selectedMapState, get) => {
        const latitude = Schema.decodeSync(Latitude)(
          selectedMapState.center.latitude
        )
        const longitude = Schema.decodeSync(Longitude)(
          selectedMapState.center.longitude
        )
        const radius = Schema.decodeSync(Radius)(selectedMapState.radius)

        return Effect.sync(() => {
          onPick(null)
          onCoordinatesChange?.({latitude, longitude, radius})
        }).pipe(
          Effect.andThen(
            get(apiAtom)
              .location.getGeocodedCoordinates({
                lang: get(appLanguageAtom),
                latitude,
                longitude,
              })
              .pipe(
                Effect.retry({
                  schedule: transientRequestRetryPolicy,
                  while: (error) => error._tag !== 'LocationNotFoundError',
                }),
                Effect.tap((data) => {
                  onPick({
                    ...data,
                    latitude,
                    longitude,
                    radius,
                  })
                }),
                Effect.tapError((error) =>
                  Effect.sync(() => {
                    onPick(null)
                    onGeocodingFailed?.(
                      error._tag === 'LocationNotFoundError'
                        ? 'notFound'
                        : 'serviceError'
                    )
                    if (error._tag !== 'LocationNotFoundError') {
                      reportLocationServiceError(
                        'Reverse geocoding failed in MapLocationWithRadiusSelect',
                        error
                      )
                    }
                  })
                )
              )
          )
        )
      },
    })

    return {
      selectedMapStateAtom,
      selectedRegionRadiusAtom: atom<string>((get) => {
        const selectedMapState = get(selectedMapStateAtom)
        return formatDecimal(
          Math.round(
            longitudeDeltaToKilometers(
              selectedMapState.radius,
              Schema.decodeSync(Latitude)(selectedMapState.center.latitude)
            ) * 10
          ) / 10,
          get(formattingLocaleAtom)
        )
      }),
      getGeocodedRegionAtom,
    }
  }, [initialSelectedMapState, onCoordinatesChange, onGeocodingFailed, onPick])
}

function PickedLocationText({
  selectedRegionRadiusAtom,
  geocodedRegionAtom,
  serviceErrorMessage,
}: {
  geocodedRegionAtom: ReturnType<typeof useAtoms>['getGeocodedRegionAtom']
  selectedRegionRadiusAtom: ReturnType<
    typeof useAtoms
  >['selectedRegionRadiusAtom']
  readonly serviceErrorMessage?: string
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
            (error) =>
              error._tag === 'LocationNotFoundError'
                ? t('map.location.errors.notFound')
                : (serviceErrorMessage ??
                  t('map.location.errors.serviceError')),
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

export default function MapLocationWithRadiusSelect({
  onPick,
  initialValue,
  topChildren,
  bottomChildren,
  onMapGesture,
  onGeocodingFailed,
  onCoordinatesChange,
  serviceErrorMessage,
  ...restProps
}: Props): React.ReactElement {
  const safeAreaInsets = useSafeAreaInsets()
  const theme = useTheme()
  const accentHighlightSecondary = theme.accentHighlightSecondary.get()
  const mapRef = useRef<MapRef>(null)
  const initialBounds = useMemo(
    () => mapValueToBounds(initialValue),
    [initialValue]
  )

  const initialSelectedMapState = useMemo(
    () => ({
      center: {
        latitude: initialValue.latitude,
        longitude: initialValue.longitude,
      },
      radius: Schema.decodeSync(Radius)(
        getWrappedLongitudeSpan(
          initialValue.viewport.southwest.longitude,
          initialValue.viewport.northeast.longitude
        ) / 2
      ),
    }),
    [initialValue]
  )
  const [containerSize, setContainerSize] = useState({width: 0, height: 0})
  const [topOverlayHeight, setTopOverlayHeight] = useState(0)
  const [bottomOverlayHeight, setBottomOverlayHeight] = useState(0)
  const [isMapReady, setIsMapReady] = useState(false)
  const isContainerMeasured =
    containerSize.width > 0 && containerSize.height > 0

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

  const atoms = useAtoms({
    initialSelectedMapState,
    onPick,
    onGeocodingFailed,
    onCoordinatesChange,
  })
  const setSelectedMapState = useSetAtom(atoms.selectedMapStateAtom)
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
  const handleMapReady = useCallback(() => {
    setIsMapReady(true)
  }, [])
  const handleMapLoadFailure = useCallback(() => {
    setIsMapReady(false)
    reportError('error', new Error('Map failed to load'))
  }, [])
  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (event.nativeEvent.userInteraction && isMapReady) {
        onMapGesture?.()
      }

      if (!isContainerMeasured) return
      if (ringDiameter <= 0) return

      const map = mapRef.current
      if (!map) return

      void Promise.all([
        map.unproject([selectionFrame.centerX, selectionFrame.centerY]),
        map.unproject([
          selectionFrame.centerX + ringDiameter / 2,
          selectionFrame.centerY,
        ]),
      ])
        .then(([centerCoordinate, radiusCoordinate]) => {
          const selectedMapState = {
            center: {
              latitude: centerCoordinate[1],
              longitude: centerCoordinate[0],
            },
            radius: calculateLongitudeRadiusDelta({
              centerLongitude: centerCoordinate[0],
              edgeLongitude: radiusCoordinate[0],
            }),
          }

          setSelectedMapState(selectedMapState)
        })
        .catch((error: unknown) => {
          reportError(
            'warn',
            new Error('Error while reading selected map region', {
              cause: error,
            }),
            {error}
          )
        })
    },
    [
      isContainerMeasured,
      isMapReady,
      onMapGesture,
      ringDiameter,
      selectionFrame,
      setSelectedMapState,
    ]
  )

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
      onLayout={handleContainerLayout}
    >
      <VexlMap
        ref={mapRef}
        contentInset={isMapReady ? overlayInsets : undefined}
        onDidFinishLoadingMap={handleMapReady}
        onDidFailLoadingMap={handleMapLoadFailure}
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera initialViewState={{bounds: initialBounds}} />
      </VexlMap>
      {isContainerMeasured ? (
        <React.Fragment>
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
        </React.Fragment>
      ) : null}

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
              serviceErrorMessage={serviceErrorMessage}
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
          <KeyboardStickyView pointerEvents="box-none">
            <Stack onLayout={handleBottomOverlayLayout}>{bottomChildren}</Stack>
          </KeyboardStickyView>
        </Stack>
      </Stack>
    </Stack>
  )
}
