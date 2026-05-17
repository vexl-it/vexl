import {useFocusEffect} from '@react-navigation/native'
import {
  type Latitude,
  type Longitude,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Stack, tokens, useTheme, useVexlTheme} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type WritableAtom,
} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Dimensions, LayoutAnimation, Platform, StyleSheet} from 'react-native'
import MapView from 'react-native-map-clustering'
import {
  Marker,
  PROVIDER_GOOGLE,
  type Details,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import Svg, {Path} from 'react-native-svg'
import {useDebounce} from 'tamagui'
import europeRegion from '../utils/europeRegion'
import {getMapTheme} from '../utils/mapStyle'

export interface Point<T> {
  data: T
  id: string
  latitude: Latitude
  longitude: Longitude
}

interface Props<T> {
  mapPadding: EdgePadding
  pointsAtom: Atom<ReadonlyArray<Point<T>>>
  onPointPress: (p: Point<T>) => void
  pointIdsToFocusAtom: Atom<ReadonlyArray<Point<T>['id']> | undefined>
  onRegionChangeComplete?: (region: Region, d: Details) => void
  refAtom?: WritableAtom<null, [v: MapView], void>
  onMapReady?: () => void
  showAllPointsInFocusMode?: boolean
}

// TODO: remove all dummy refs and func after react-native-map-clustering update to newer version
// default props do not work in new version of react therefore this causes errors after update do EXPO 53
const mapClusteringDefaultProps = {
  clusteringEnabled: true,
  spiralEnabled: true,
  animationEnabled: true,
  preserveClusterPressBehavior: false,
  layoutAnimationConf: LayoutAnimation.Presets.spring,
  tracksViewChanges: false,
  // SuperCluster parameters
  radius: Dimensions.get('window').width * 0.06,
  maxZoom: 20,
  minZoom: 1,
  minPoints: 2,
  extent: 512,
  nodeSize: 64,
  // Map parameters
  edgePadding: {top: 50, left: 50, right: 50, bottom: 50},
  // Cluster styles
  clusterColor: 'green',
  clusterTextColor: 'white',
  spiderLineColor: 'red',
  // Callbacks
  onRegionChangeComplete: () => {},
  onClusterPress: () => {},
  onMarkersChange: () => {},
  superClusterRef: {},
  mapRef: () => {},
}

const emptyAtom = atom<MapView | undefined>(undefined)
const PIN_MARKER_SIZE = 32
const PIN_MARKER_ASPECT_RATIO = 43 / 32
const PIN_MARKER_HEIGHT = PIN_MARKER_SIZE * PIN_MARKER_ASPECT_RATIO
const PIN_TRACKING_SETTLE_MS = 260
const REGION_CHANGE_DEBOUNCE_MS = 250

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.radius[3].val,
  },
})

function PinMarker({
  centerColor,
  color,
  size,
}: {
  centerColor: string
  color: string
  size: number
}): React.ReactElement {
  return (
    <Svg
      width={size}
      height={size * PIN_MARKER_ASPECT_RATIO}
      viewBox="0 0 32 43"
      fill="none"
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.733 41.915C19.87 39.039 32 27.195 32 16C32 7.163 24.837 0 16 0S0 7.163 0 16c0 10.952 12.145 22.989 15.273 25.908.415.388 1.042.391 1.46.007Z"
        fill={color}
      />
      <Path
        d="M16 21.142c2.524 0 4.571-2.047 4.571-4.571S18.524 12 16 12s-4.571 2.047-4.571 4.571S13.476 21.142 16 21.142Z"
        fill={centerColor}
      />
    </Svg>
  )
}

function PinMapMarker<T>({
  centerColor,
  color,
  emphasized = false,
  onPointPress,
  point,
}: {
  centerColor: string
  color: string
  emphasized?: boolean
  onPointPress: (p: Point<T>) => void
  point: Point<T>
}): React.ReactElement {
  const [tracksViewChanges, setTracksViewChanges] = useState(true)

  useEffect(() => {
    setTracksViewChanges(true)

    const settleTimeout = setTimeout(() => {
      setTracksViewChanges(false)
    }, PIN_TRACKING_SETTLE_MS)

    return () => {
      clearTimeout(settleTimeout)
    }
  }, [centerColor, color, emphasized, point.id])

  return (
    <Marker
      zIndex={emphasized ? 999 : undefined}
      tracksViewChanges={tracksViewChanges || Platform.OS === 'ios'}
      coordinate={{
        latitude: point.latitude,
        longitude: point.longitude,
      }}
      anchor={{x: 0.5, y: 1}}
      onPress={() => {
        onPointPress(point)
      }}
    >
      <Stack
        w={PIN_MARKER_SIZE}
        h={PIN_MARKER_HEIGHT}
        alignItems="center"
        justifyContent="center"
      >
        <PinMarker
          centerColor={centerColor}
          color={color}
          size={PIN_MARKER_SIZE}
        />
      </Stack>
    </Marker>
  )
}

function MMapView({
  children,
  refAtom,
  mapPadding,
  inFocusMode,
  onMapReady,
  onRegionChangeComplete,
}: {
  children: React.ReactNode
  refAtom?: WritableAtom<null, [v: MapView], void>
  mapPadding: EdgePadding
  inFocusMode: boolean
  onMapReady?: () => void
  onRegionChangeComplete?: (region: Region, d: Details) => void
}): React.ReactElement {
  const {resolvedTheme} = useVexlTheme()
  const theme = useTheme()
  const accentYellowPrimary = theme.accentYellowPrimary.get()
  const backgroundHighlight = theme.backgroundHighlight.get()
  const backgroundPrimary = theme.backgroundPrimary.get()
  const clusterTextColor =
    resolvedTheme === 'dark'
      ? theme.backgroundPrimary.get()
      : theme.foregroundPrimary.get()
  const ref = useRef<MapView>(null)
  // TODO: remove after update of react-native-map-clustering
  const dummySuperClusterRefFnc = useRef(null)
  const setMapViewRef = useSetAtom(refAtom ?? emptyAtom)
  const loadedCallbackCalledRef = useRef(false)

  const onMapLoaded = useCallback(() => {
    if (loadedCallbackCalledRef.current) return
    loadedCallbackCalledRef.current = true
    onMapReady?.()
  }, [onMapReady])

  useFocusEffect(
    useCallback(() => {
      setMapViewRef(ref.current ?? undefined)
    }, [ref, setMapViewRef])
  )

  const onChangedDebounce = useDebounce(
    useCallback(
      (region: Region, details: Details) => {
        if (onRegionChangeComplete) onRegionChangeComplete(region, details)
      },
      [onRegionChangeComplete]
    ),
    REGION_CHANGE_DEBOUNCE_MS
  )

  return (
    <MapView
      {...mapClusteringDefaultProps}
      ref={ref}
      superClusterRef={dummySuperClusterRefFnc}
      initialRegion={europeRegion}
      clusterColor={inFocusMode ? backgroundHighlight : accentYellowPrimary}
      clusterTextColor={clusterTextColor}
      customMapStyle={getMapTheme(resolvedTheme)}
      onMapLoaded={onMapLoaded}
      layoutAnimationConf={{duration: 150}}
      minZoom={0}
      maxZoom={20}
      loadingBackgroundColor={backgroundPrimary}
      loadingIndicatorColor={
        inFocusMode ? backgroundHighlight : accentYellowPrimary
      }
      clusteringEnabled
      loadingEnabled
      provider={PROVIDER_GOOGLE}
      mapPadding={mapPadding}
      toolbarEnabled={false}
      style={[styles.map, {backgroundColor: backgroundPrimary}]}
      onRegionChange={onChangedDebounce}
    >
      {children}
    </MapView>
  )
}

export default function MapDisplayMultiplePoints<T>({
  pointIdsToFocusAtom,
  mapPadding,
  onPointPress,
  pointsAtom,
  onRegionChangeComplete,
  refAtom,
  onMapReady,
  showAllPointsInFocusMode = false,
}: Props<T>): React.ReactElement {
  const points = useAtomValue(pointsAtom)
  const idsToFocus = useAtomValue(pointIdsToFocusAtom)
  const theme = useTheme()
  const pinColor = theme.foregroundPrimary.get()
  const pinCenterColor = theme.backgroundPrimary.get()
  const focusedPinColor = theme.accentHighlightSecondary.get()
  const [notFocusedPoints, focusedPoints] = pipe(
    points,
    Array.partition((point) => idsToFocus?.includes(point.id) ?? false)
  )

  const isInFocusMode = focusedPoints.length > 0
  const shouldRenderNotFocusedPoints =
    !isInFocusMode || showAllPointsInFocusMode

  return (
    <Stack w="100%" h="100%" position="relative">
      <MMapView
        inFocusMode={isInFocusMode}
        refAtom={refAtom}
        mapPadding={mapPadding}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {shouldRenderNotFocusedPoints
          ? notFocusedPoints.map((point) => (
              <PinMapMarker
                key={point.id}
                centerColor={pinCenterColor}
                color={pinColor}
                onPointPress={onPointPress}
                point={point}
              />
            ))
          : null}
        {focusedPoints.map((point) => {
          return (
            <PinMapMarker
              key={point.id}
              centerColor={pinCenterColor}
              color={focusedPinColor}
              emphasized
              onPointPress={onPointPress}
              point={point}
            />
          )
        })}
      </MMapView>
    </Stack>
  )
}
