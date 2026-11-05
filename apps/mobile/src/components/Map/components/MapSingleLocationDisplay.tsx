import {Camera, Marker} from '@maplibre/maplibre-react-native'
import {MapOverlayLayout, Stack} from '@vexl-next/ui'
import React, {useMemo} from 'react'
import {Image} from 'react-native'
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
      <MapOverlayLayout
        top={topChildren}
        middle={middleChildren}
        bottom={bottomChildren}
      />
    </Stack>
  )
}
