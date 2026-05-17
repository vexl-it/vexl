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
import {Dimensions, StyleSheet} from 'react-native'
import MapView, {PROVIDER_GOOGLE, type Region} from 'react-native-maps'
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
import {MapPinAsset, RadiusRingAsset} from './MapSvgAssets'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  onPick: (place: MapValueWithRadius | null) => void
  hideSlider?: boolean
  mapRef: React.RefObject<MapView | null>
}

const mapPaddings = {
  top: tokens.space[10].val,
  bottom: tokens.space[10].val,
  left: 0,
  right: 0,
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

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(value, MAX_ZOOM))
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialRegion,
  onPick,
}: {
  onPick: (place: MapValueWithRadius | null) => void
  initialRegion: Region
}) {
  return useMemo(() => {
    const {
      effectiveInputAtom: selectedRegionAtom,
      resultAtom: getGeocodedRegionAtom,
    } = createEffectAtomWithProgress({
      inputAtom: atom(initialRegion),
      effectToRun: (region, get) =>
        get(apiAtom)
          .location.getGeocodedCoordinates({
            lang: getCurrentLocale(),
            latitude: Schema.decodeSync(Latitude)(region.latitude),
            longitude: Schema.decodeSync(Longitude)(region.longitude),
          })
          .pipe(
            Effect.tap((data) => {
              const {width} = Dimensions.get('window')
              const usedWidthWithoutPadding = (width - circleMargin * 2) / width

              onPick({
                ...data,
                latitude: Schema.decodeSync(Latitude)(region.latitude),
                longitude: Schema.decodeSync(Longitude)(region.longitude),
                radius: Schema.decodeSync(Radius)(
                  (Math.abs(region.longitudeDelta) * usedWidthWithoutPadding) /
                    2
                ),
              })
              return data
            })
          ),
    })

    return {
      selectedRegionAtom,
      selectedRegionRadiusAtom: atom<string>((get) => {
        const {width} = Dimensions.get('window')
        const usedWidthWithoutPadding = (width - circleMargin * 2) / width

        const selectedRegion = get(selectedRegionAtom)
        const radiusLongitudeDeg =
          (selectedRegion.longitudeDelta * usedWidthWithoutPadding) / 2
        return Intl.NumberFormat(getCurrentLocale()).format(
          Math.round(
            longitudeDeltaToKilometers(
              radiusLongitudeDeg,
              Schema.decodeSync(Latitude)(selectedRegion.latitude)
            ) * 10
          ) / 10
        )
      }),
      getGeocodedRegionAtom,
    }
  }, [initialRegion, onPick])
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

  useEffect(() => {
    setZoom(initialZoom)
  }, [initialZoom])

  const atoms = useAtoms({
    initialRegion,
    onPick,
  })
  const setRegion = useSetAtom(atoms.selectedRegionAtom)
  const {width, height} = useMemo(() => Dimensions.get('window'), [])
  const handleZoomChange = useCallback(
    (value: number) => {
      setZoom(value)
      mapRef.current?.setCamera({
        zoom: value,
      })
    },
    [mapRef]
  )

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
    >
      <MapView
        ref={mapRef}
        mapPadding={mapPaddings}
        provider={PROVIDER_GOOGLE}
        customMapStyle={getMapTheme(resolvedTheme)}
        style={[styles.map, {backgroundColor: backgroundPrimary}]}
        toolbarEnabled={false}
        onRegionChangeComplete={(region) => {
          void mapRef.current
            ?.coordinateForPoint({x: width / 2, y: height / 2})
            .then((v) => {
              setRegion({...region, ...v})
            })
        }}
        region={initialRegion}
      />
      <Stack
        pointerEvents="none"
        position="absolute"
        top="50%"
        left="50%"
        transform={[{translateX: -70 / 2}, {translateY: (-70 / 3) * 2}]}
      >
        <MapPinAsset color={accentHighlightSecondary} />
      </Stack>

      <Stack
        pointerEvents="none"
        position="absolute"
        justifyContent="center"
        alignItems="center"
        marginHorizontal={circleMargin}
        top={0}
        right={0}
        left={0}
        bottom={0}
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
        <Stack flex={3}></Stack>
        <Stack flex={2} p="$2">
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
          <Stack>{topChildren}</Stack>
          <Stack pointerEvents="none" flex={1}></Stack>
          <Stack>
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
