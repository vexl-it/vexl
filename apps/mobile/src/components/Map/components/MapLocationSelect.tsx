import {
  Camera,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  KeyboardStickyView,
  Stack,
  Typography,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type NativeSyntheticEvent} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {apiAtom} from '../../../api'
import {createEffectAtomWithProgress} from '../../../utils/atomUtils/createEffectAtomWithProgress'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {appLanguageAtom} from '../../../utils/preferences'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {type MapValue} from '../brands'
import {type EdgePadding, type LatLng} from '../types'
import {mapValueToBounds} from '../utils/mapLibreRegion'
import {MapPinAsset} from './MapSvgAssets'
import VexlMap from './VexlMap'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  middleChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  mapPadding?: EdgePadding
  onPick: (place: MapValue | null) => void
  onMapMoved?: () => void
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useAtoms({
  initialCenter,
  onPick,
}: {
  onPick: (place: MapValue | null) => void
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
            lang: get(appLanguageAtom),
            latitude: Schema.decodeSync(Latitude)(center.latitude),
            longitude: Schema.decodeSync(Longitude)(center.longitude),
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
      selectedCenterAtom,
      getGeocodedRegionAtom,
    }
  }, [initialCenter, onPick])
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
  })
  const geocodingState = useAtomValue(atoms.getGeocodedRegionAtom)
  const setCenter = useSetAtom(atoms.selectedCenterAtom)

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!event.nativeEvent.userInteraction) return

      onMapMoved?.()
      setCenter({
        latitude: event.nativeEvent.center[1],
        longitude: event.nativeEvent.center[0],
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
          <KeyboardStickyView pointerEvents="box-none">
            <Stack>
              {bottomChildren}
              <Stack
                width="100%"
                height={safeAreaInsets.bottom}
                backgroundColor="$backgroundPrimary"
              />
            </Stack>
          </KeyboardStickyView>
        </Stack>
      </Stack>
    </Stack>
  )
}
