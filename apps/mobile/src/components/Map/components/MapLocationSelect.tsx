import {
  Camera,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  MapLabelPill,
  MapOverlayLayout,
  MapPin,
  mapPinTipTransform,
  Stack,
  useTheme,
} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {type NativeSyntheticEvent} from 'react-native'
import {apiAtom} from '../../../api'
import {createEffectAtomWithProgress} from '../../../utils/atomUtils/createEffectAtomWithProgress'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {currentAppLanguageAtom} from '../../../utils/preferences'
import {reportLocationServiceError} from '../../../utils/reportLocationServiceError'
import {transientRequestRetryPolicy} from '../../../utils/transientRequestRetryPolicy'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {type MapValue} from '../brands'
import {
  type EdgePadding,
  type GeocodingFailureKind,
  type LatLng,
} from '../types'
import {mapValueToBounds} from '../utils/mapLibreRegion'
import VexlMap from './VexlMap'

const MapCenterSchema = Schema.Tuple(Longitude, Latitude)

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  middleChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  mapPadding?: EdgePadding
  onPick: (place: MapValue | null) => void
  readonly onGeocodingFailed?: (kind: GeocodingFailureKind) => void
  readonly onGeocodingInProgressChange?: (inProgress: boolean) => void
  onMapMoved?: () => void
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialCenter,
  onPick,
  onGeocodingFailed,
}: {
  onPick: (place: MapValue | null) => void
  readonly onGeocodingFailed?: (kind: GeocodingFailureKind) => void
  initialCenter: LatLng
}) {
  return useMemo(() => {
    const {
      effectiveInputAtom: selectedCenterAtom,
      resultAtom: getGeocodedRegionAtom,
    } = createEffectAtomWithProgress({
      inputAtom: atom<LatLng>(initialCenter),
      effectToRun: (center, get) =>
        get(apiAtom)
          .location.getGeocodedCoordinates({
            lang: get(currentAppLanguageAtom),
            latitude: Schema.decodeSync(Latitude)(center.latitude),
            longitude: Schema.decodeSync(Longitude)(center.longitude),
          })
          .pipe(
            Effect.retry({
              schedule: transientRequestRetryPolicy,
              while: (error) => error._tag !== 'LocationNotFoundError',
            }),
            Effect.tap((data) =>
              Effect.sync(() => {
                onPick(data)
              })
            ),
            Effect.tapError((error) =>
              Effect.sync(() => {
                onGeocodingFailed?.(
                  error._tag === 'LocationNotFoundError'
                    ? 'notFound'
                    : 'serviceError'
                )
                if (error._tag !== 'LocationNotFoundError') {
                  reportLocationServiceError(
                    'Reverse geocoding failed in MapLocationSelect',
                    error
                  )
                }
              })
            )
          ),
    })

    return {
      selectedCenterAtom,
      getGeocodedRegionAtom,
    }
  }, [initialCenter, onGeocodingFailed, onPick])
}

type AtomValue<T> = T extends Atom<infer Value> ? Value : never

function PickedLocationPill({
  geocodingState,
}: {
  geocodingState: AtomValue<
    ReturnType<typeof useAtoms>['getGeocodedRegionAtom']
  >
}): React.ReactElement {
  const {t} = useTranslation()

  if (geocodingState.state !== 'done') return <MapLabelPill label="" loading />

  return (
    <MapLabelPill
      error={E.isLeft(geocodingState.result)}
      label={pipe(
        geocodingState.result,
        E.match(
          (l) =>
            toCommonErrorMessage(l, t) ?? t('map.location.errors.notFound'),
          (data) => data?.address ?? t('map.locationSelect.hint')
        )
      )}
    />
  )
}

export default function MapLocationSelect({
  onPick,
  onGeocodingFailed,
  onGeocodingInProgressChange,
  onMapMoved,
  initialValue,
  topChildren,
  middleChildren,
  bottomChildren,
  mapPadding,
  ...restProps
}: Props): React.ReactElement {
  const theme = useTheme()
  const accentHighlightSecondary = theme.accentHighlightSecondary.get()

  const initialCenter = useMemo(
    () => ({
      latitude: initialValue.latitude,
      longitude: initialValue.longitude,
    }),
    [initialValue]
  )
  const initialBounds = useMemo(
    () => mapValueToBounds(initialValue),
    [initialValue]
  )

  const atoms = useAtoms({
    initialCenter,
    onPick,
    onGeocodingFailed,
  })
  const geocodingState = useAtomValue(atoms.getGeocodedRegionAtom)
  const setCenter = useSetAtom(atoms.selectedCenterAtom)

  useEffect(() => {
    setCenter(initialCenter)
  }, [initialCenter, setCenter])

  const isGeocodingInProgress = geocodingState.state !== 'done'
  useEffect(() => {
    onGeocodingInProgressChange?.(isGeocodingInProgress)
  }, [isGeocodingInProgress, onGeocodingInProgressChange])

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!event.nativeEvent.userInteraction) return

      const center = Effect.runSync(
        Effect.either(
          Schema.decodeUnknown(MapCenterSchema)(event.nativeEvent.center)
        )
      )
      if (E.isLeft(center)) return

      onMapMoved?.()
      setCenter({
        latitude: center.right[1],
        longitude: center.right[0],
      })
    },
    [onMapMoved, setCenter]
  )

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
    >
      <VexlMap
        contentInset={mapPadding}
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera bounds={initialBounds} />
      </VexlMap>
      <Stack
        pointerEvents="none"
        position="absolute"
        top="50%"
        left="50%"
        transform={mapPinTipTransform}
      >
        <MapPin color={accentHighlightSecondary} />
      </Stack>
      <MapOverlayLayout
        top={topChildren}
        middle={
          middleChildren ?? (
            <PickedLocationPill geocodingState={geocodingState} />
          )
        }
        bottom={bottomChildren}
      />
    </Stack>
  )
}
