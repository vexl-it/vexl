import {
  Latitude,
  Longitude,
  Radius,
  longitudeDeltaToKilometers,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type GetGeocodedCoordinatesResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {Effect, Either, Exit, Fiber} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo, useRef} from 'react'
import {Dimensions} from 'react-native'
import MapView, {PROVIDER_GOOGLE, type Region} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, getTokens} from 'tamagui'
import {apiAtom} from '../../../api'
import {
  loadableEffectEither,
  type UnknownLoadingError,
} from '../../../utils/atomUtils/loadableEither'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import Image from '../../Image'
import Slider from '../../Slider'
import {type MapValue, type MapValueWithRadius} from '../brands'
import pinSvg from '../img/pinSvg'
import radiusRingSvg from '../img/radiusRingSvg'
import mapTheme from '../utils/mapStyle'
import mapValueToRegion from '../utils/mapValueToRegion'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  onPick: (place: MapValueWithRadius | null) => void
}

const mapPaddings = {
  top: getTokens().space[10].val,
  bottom: getTokens().space[10].val,
  left: 0,
  right: 0,
}

const circleMargin = getTokens().space[2].val

const mapStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: 'black',
} as const

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialRegion,
  onPick,
}: {
  onPick: (place: MapValueWithRadius | null) => void
  initialRegion: Region
}) {
  const api = useAtomValue(apiAtom)

  return useMemo(() => {
    const selectedRegionAtom = atom<Region>(initialRegion)

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
              Latitude.parse(selectedRegion.latitude)
            ) * 10
          ) / 10
        )
      }),
      getGeocodedRegion: loadableEffectEither(
        atom(
          async (
            get,
            {signal}
          ): Promise<
            Either.Either<
              GetGeocodedCoordinatesResponse,
              | Effect.Effect.Error<
                  ReturnType<typeof api.location.getGeocodedCoordinates>
                >
              | UnknownLoadingError
            >
          > => {
            const region = get(selectedRegionAtom)

            onPick(null) // loading
            const fiber = Effect.runFork(
              api.location
                .getGeocodedCoordinates({
                  query: {
                    lang: getCurrentLocale(),
                    latitude: Latitude.parse(region.latitude),
                    longitude: Longitude.parse(region.longitude),
                  },
                })
                .pipe(
                  Effect.map((data) => {
                    const {width} = Dimensions.get('window')
                    const usedWidthWithoutPadding =
                      (width - circleMargin * 2) / width

                    onPick({
                      ...data,
                      latitude: Latitude.parse(region.latitude),
                      longitude: Longitude.parse(region.longitude),
                      radius: Radius.parse(
                        (Math.abs(region.longitudeDelta) *
                          usedWidthWithoutPadding) /
                          2
                      ),
                    })
                    return data
                  }),
                  Effect.either
                )
            )

            signal.onabort = () => {
              Effect.runFork(Fiber.interruptFork(fiber))
            }

            const exit = await Effect.runPromise(Fiber.await(fiber))

            if (Exit.isSuccess(exit)) {
              return exit.value
            }

            return Either.left({
              _tag: 'UnknownLoadingError',
              error: exit.cause,
            } as UnknownLoadingError)
          }
        )
      ),
    }
  }, [api, initialRegion, onPick])
}

function PickedLocationText({
  selectedRegionRadiusAtom,
  geocodedRegionAtom,
}: {
  geocodedRegionAtom: ReturnType<typeof useAtoms>['getGeocodedRegion']
  selectedRegionRadiusAtom: ReturnType<
    typeof useAtoms
  >['selectedRegionRadiusAtom']
}): React.ReactElement {
  const geocodingState = useAtomValue(geocodedRegionAtom)
  const {t} = useTranslation()
  const radius = useAtomValue(selectedRegionRadiusAtom)

  return geocodingState.state === 'loading' ? (
    <Text>{t('common.loading')}...</Text>
  ) : (
    <React.Fragment>
      <Text
        ta="center"
        color={E.isLeft(geocodingState.either) ? '$red' : '$white'}
      >
        {pipe(
          geocodingState.either,
          E.match(
            (l) =>
              toCommonErrorMessage(l, t) ?? t('map.location.errors.notFound'),
            (data) => data?.address ?? t('map.locationSelect.hint')
          )
        )}
      </Text>
      <Text
        ta="center"
        color={E.isLeft(geocodingState.either) ? '$red' : '$white'}
      >
        {t('map.locationSelect.radius', {
          radius,
        })}
      </Text>
    </React.Fragment>
  )
}

function calculateZoom(
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
  ...restProps
}: Props): React.ReactElement {
  const safeAreaInsets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const initialRegion = useMemo(
    () => mapValueToRegion(initialValue),
    [initialValue]
  )

  const initialZoom = useMemo(
    () =>
      calculateZoom(
        initialRegion.latitude,
        initialRegion.latitudeDelta,
        initialRegion.longitudeDelta
      ),
    [initialRegion]
  )

  const atoms = useAtoms({
    initialRegion,
    onPick,
  })
  const setRegion = useSetAtom(atoms.selectedRegionAtom)
  const {width, height} = useMemo(() => Dimensions.get('window'), [])

  return (
    <Stack position="relative" {...restProps} backgroundColor="$black">
      <MapView
        ref={mapRef}
        mapPadding={mapPaddings}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapTheme}
        style={mapStyle}
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
        <Image width={70} height={70} source={pinSvg} />
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
        <Image source={radiusRingSvg} />
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
            backgroundColor="rgba(0, 0, 0,0.8)"
          >
            <PickedLocationText
              geocodedRegionAtom={atoms.getGeocodedRegion}
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
            <Stack mb="$4" mx="$4">
              <Slider
                value={initialZoom}
                step={0.2}
                onValueChange={(v) => {
                  mapRef.current?.setCamera({
                    zoom: v[0],
                  })
                }}
                maximumValue={16}
                minimumValue={7}
              />
            </Stack>
            {bottomChildren}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
