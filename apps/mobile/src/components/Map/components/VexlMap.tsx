import {
  Map as MapLibreMap,
  type MapProps,
} from '@maplibre/maplibre-react-native'
import {useTheme, useVexlTheme} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {StyleSheet} from 'react-native'
import {mapStyleUrlsAtom} from '../state/mapStyleUrlsAtoms'

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
})

type Props = Omit<MapProps, 'mapStyle'>

export default function VexlMap({
  style,
  ...restProps
}: Props): React.ReactElement {
  const {resolvedTheme} = useVexlTheme()
  const theme = useTheme()
  const backgroundPrimary = theme.backgroundPrimary.get()
  const mapStyleUrls = useAtomValue(mapStyleUrlsAtom)

  return (
    <MapLibreMap
      mapStyle={mapStyleUrls[resolvedTheme]}
      logo={false}
      compass={false}
      touchPitch={false}
      style={[styles.map, {backgroundColor: backgroundPrimary}, style]}
      {...restProps}
    />
  )
}
