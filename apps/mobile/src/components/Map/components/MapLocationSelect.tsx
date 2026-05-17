import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Stack, Typography, YStack, useTheme, useVexlTheme} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useEffect, useMemo, useState} from 'react'
import {StyleSheet} from 'react-native'
import MapView, {
  PROVIDER_GOOGLE,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {apiAtom} from '../../../api'
import {createEffectAtomWithProgress} from '../../../utils/atomUtils/createEffectAtomWithProgress'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {type MapValue} from '../brands'
import {getMapTheme} from '../utils/mapStyle'
import mapValueToRegion from '../utils/mapValueToRegion'
import {MapPinAsset} from './MapSvgAssets'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  middleChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  mapPadding?: EdgePadding
  onPick: (place: MapValue | null) => void
  onMapMoved?: () => void
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialRegion,
  onPick,
}: {
  onPick: (place: MapValue | null) => void
  initialRegion: Region
}) {
  return useMemo(() => {
    const {
      effectiveInputAtom: selectedRegionAtom,
      resultAtom: getGeocodedRegionAtom,
    } = createEffectAtomWithProgress({
      inputAtom: atom<Region>(initialRegion),
      effectToRun: (region, get) =>
        get(apiAtom)
          .location.getGeocodedCoordinates({
            lang: getCurrentLocale(),
            latitude: Schema.decodeSync(Latitude)(region.latitude),
            longitude: Schema.decodeSync(Longitude)(region.longitude),
          })
          .pipe(
            Effect.tap((data) =>
              Effect.sync(() => {
                onPick(data)
              })
            )
          ),
    })

    return {
      selectedRegionAtom,
      getGeocodedRegionAtom,
    }
  }, [initialRegion, onPick])
}

type AtomValue<T> = T extends Atom<infer Value> ? Value : never

function PickedLocationText({
  geocodingState,
}: {
  geocodingState: AtomValue<
    ReturnType<typeof useAtoms>['getGeocodedRegionAtom']
  >
}): React.ReactElement {
  const {t} = useTranslation()

  if (geocodingState.state !== 'done')
    return (
      <Typography variant="micro" color="$foregroundPrimary">
        {t('common.loading')}...
      </Typography>
    )

  const color = E.isLeft(geocodingState.result)
    ? '$redForeground'
    : '$foregroundPrimary'
  const text = pipe(
    geocodingState.result,
    E.match(
      (l) => toCommonErrorMessage(l, t) ?? t('map.location.errors.notFound'),
      (data) => data?.address ?? t('map.locationSelect.hint')
    )
  )

  return (
    <Typography variant="micro" textAlign="center" color={color}>
      {text}
    </Typography>
  )
}

export default function MapLocationSelect({
  onPick,
  onMapMoved,
  initialValue,
  topChildren,
  middleChildren,
  bottomChildren,
  mapPadding,
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
  const [currentRegion, setCurrentRegion] = useState(initialRegion)

  const atoms = useAtoms({
    initialRegion,
    onPick,
  })
  const geocodingState = useAtomValue(atoms.getGeocodedRegionAtom)
  const setRegion = useSetAtom(atoms.selectedRegionAtom)

  useEffect(() => {
    setCurrentRegion(initialRegion)
  }, [initialRegion])

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
    >
      <MapView
        mapPadding={mapPadding}
        provider={PROVIDER_GOOGLE}
        toolbarEnabled={false}
        customMapStyle={getMapTheme(resolvedTheme)}
        style={[styles.map, {backgroundColor: backgroundPrimary}]}
        onRegionChangeComplete={(region, {isGesture}) => {
          if (isGesture) {
            onMapMoved?.()
            setCurrentRegion(region)
            setRegion(region)
          }
        }}
        region={currentRegion}
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
        top={0}
        left={0}
        right={0}
        bottom={0}
        h="100%"
        w="100%"
      >
        <Stack flex={3}></Stack>
        <Stack flex={2} p="$2">
          {middleChildren ?? (
            <Stack
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderRadius="$6"
              alignSelf="center"
              backgroundColor="$backgroundPrimary"
            >
              <PickedLocationText geocodingState={geocodingState} />
            </Stack>
          )}
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
          paddingLeft={safeAreaInsets.left}
          paddingRight={safeAreaInsets.right}
        >
          <YStack>
            <Stack
              width="100%"
              height={safeAreaInsets.top}
              backgroundColor="$backgroundPrimary"
            />
            {topChildren}
          </YStack>
          <Stack pointerEvents="none" flex={1}></Stack>
          <Stack>
            {bottomChildren}
            <Stack
              width="100%"
              height={safeAreaInsets.bottom}
              backgroundColor="$backgroundPrimary"
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
