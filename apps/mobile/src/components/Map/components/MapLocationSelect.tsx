import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Effect} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import MapView, {
  PROVIDER_GOOGLE,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text} from 'tamagui'
import {apiAtom} from '../../../api'
import {createEffectAtomWithProgress} from '../../../utils/atomUtils/createEffectAtomWithProgress'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import Image from '../../Image'
import {type MapValue} from '../brands'
import pinSvg from '../img/pinSvg'
import mapTheme from '../utils/mapStyle'
import mapValueToRegion from '../utils/mapValueToRegion'

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  initialValue: MapValue
  mapPadding?: EdgePadding
  onPick: (place: MapValue | null) => void
}

const mapStyle = {
  width: '100%',
  height: '100%',
} as const

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
            query: {
              lang: getCurrentLocale(),
              latitude: Latitude.parse(region.latitude),
              longitude: Longitude.parse(region.longitude),
            },
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

function PickedLocationText({
  atom,
}: {
  atom: ReturnType<typeof useAtoms>['getGeocodedRegionAtom']
}): React.ReactElement {
  const geocodingState = useAtomValue(atom)
  const {t} = useTranslation()

  if (geocodingState.state !== 'done')
    return <Text>{t('common.loading')}...</Text>

  const color = E.isLeft(geocodingState.result) ? '$red' : '$white'
  const text = pipe(
    geocodingState.result,
    E.match(
      (l) => toCommonErrorMessage(l, t) ?? t('map.location.errors.notFound'),
      (data) => data?.address ?? t('map.locationSelect.hint')
    )
  )

  return (
    <Text ta="center" color={color}>
      {text}
    </Text>
  )
}

export default function MapLocationSelect({
  onPick,
  initialValue,
  topChildren,
  bottomChildren,
  mapPadding,
  ...restProps
}: Props): React.ReactElement {
  const safeAreaInsets = useSafeAreaInsets()

  const initialRegion = useMemo(
    () => mapValueToRegion(initialValue),
    [initialValue]
  )

  const atoms = useAtoms({
    initialRegion,
    onPick,
  })
  const setRegion = useSetAtom(atoms.selectedRegionAtom)

  return (
    <Stack position="relative" {...restProps} backgroundColor="$black">
      <MapView
        mapPadding={mapPadding}
        provider={PROVIDER_GOOGLE}
        toolbarEnabled={false}
        customMapStyle={mapTheme}
        style={mapStyle}
        onRegionChangeComplete={(region, {isGesture}) => {
          if (isGesture) {
            setRegion(region)
          }
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
            <PickedLocationText atom={atoms.getGeocodedRegionAtom} />
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
          <Stack>{bottomChildren}</Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
