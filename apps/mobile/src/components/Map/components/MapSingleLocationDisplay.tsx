import {Camera, Marker} from '@maplibre/maplibre-react-native'
import {Stack} from '@vexl-next/ui'
import React, {useMemo} from 'react'
import {Image} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type MapValue} from '../brands'
import {type EdgePadding} from '../types'
import {mapValueToBounds} from '../utils/mapLibreRegion'
import VexlMap from './VexlMap'

const markerImage = require('../img/pin.png')

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  middleChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  value: MapValue
  mapPadding?: EdgePadding
  interactive?: boolean
}

export default function MapSingleLocationDisplay({
  topChildren,
  middleChildren,
  bottomChildren,
  value,
  mapPadding,
  interactive = true,
  ...restProps
}: Props): React.ReactElement {
  const safeAreaInsets = useSafeAreaInsets()
  const bounds = useMemo(() => mapValueToBounds(value), [value])

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
    >
      <VexlMap
        contentInset={mapPadding}
        dragPan={interactive}
        touchZoom={interactive}
        doubleTapZoom={interactive}
        doubleTapHoldZoom={interactive}
        touchRotate={interactive}
      >
        <Camera bounds={bounds} />
        <Marker anchor="bottom" lngLat={[value.longitude, value.latitude]}>
          <Image source={markerImage} />
        </Marker>
      </VexlMap>
      {middleChildren ? (
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
            {middleChildren}
          </Stack>
        </Stack>
      ) : null}
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
          <Stack
            backgroundColor="$backgroundPrimary"
            height={safeAreaInsets.top}
          ></Stack>
          <Stack>{topChildren}</Stack>
          <Stack pointerEvents="none" flex={1}></Stack>
          <Stack>{bottomChildren}</Stack>
          <Stack
            backgroundColor="$backgroundPrimary"
            height={safeAreaInsets.bottom}
          ></Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
