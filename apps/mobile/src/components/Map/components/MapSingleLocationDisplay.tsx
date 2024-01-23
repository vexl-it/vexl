import {useMemo} from 'react'
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {type MapValue} from '../brands'
import calculateDeltaFromViewport from '../utils/calculateDeltaFromViewport'
import mapTheme from '../utils/mapStyle'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const markerImage = require('../img/pin.png')

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  value: MapValue
  mapPadding?: EdgePadding
}

const mapStyle = {
  width: '100%',
  height: '100%',
} as const

export default function MapSingleLocationDisplay({
  topChildren,
  bottomChildren,
  value,
  mapPadding,
  ...restProps
}: Props): JSX.Element {
  const safeAreaInsets = useSafeAreaInsets()

  const initialRegion = useMemo((): Region => {
    const deltas = calculateDeltaFromViewport(value.viewport)
    return {
      latitude: value.latitude,
      longitude: value.longitude,
      ...deltas,
    }
  }, [value])

  return (
    <Stack position="relative" {...restProps} backgroundColor="$black">
      <MapView
        mapPadding={mapPadding}
        style={mapStyle}
        provider={PROVIDER_GOOGLE}
        region={initialRegion}
        customMapStyle={mapTheme}
      >
        <Marker image={markerImage} coordinate={value} />
      </MapView>
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
