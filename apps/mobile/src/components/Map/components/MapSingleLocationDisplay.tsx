import {Stack, useTheme, useVexlTheme} from '@vexl-next/ui'
import React, {useMemo} from 'react'
import {StyleSheet} from 'react-native'
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type EdgePadding,
} from 'react-native-maps'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type MapValue} from '../brands'
import {getMapTheme} from '../utils/mapStyle'
import mapValueToRegion from '../utils/mapValueToRegion'

const markerImage = require('../img/pin.png')

type Props = React.ComponentProps<typeof Stack> & {
  topChildren?: React.ReactNode
  middleChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
  value: MapValue
  mapPadding?: EdgePadding
  interactive?: boolean
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
})

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
  const {resolvedTheme} = useVexlTheme()
  const theme = useTheme()
  const backgroundPrimary = theme.backgroundPrimary.get()

  return (
    <Stack
      position="relative"
      {...restProps}
      backgroundColor="$backgroundPrimary"
    >
      <MapView
        mapPadding={mapPadding}
        style={[styles.map, {backgroundColor: backgroundPrimary}]}
        toolbarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        zoomTapEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        provider={PROVIDER_GOOGLE}
        region={useMemo(() => mapValueToRegion(value), [value])}
        customMapStyle={getMapTheme(resolvedTheme)}
      >
        <Marker image={markerImage} coordinate={value} />
      </MapView>
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
