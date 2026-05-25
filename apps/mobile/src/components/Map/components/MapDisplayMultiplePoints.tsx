import {useFocusEffect} from '@react-navigation/native'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  Image,
  marketplaceMapPinDefaultDark,
  marketplaceMapPinDefaultLight,
  marketplaceMapPinFocusedDark,
  marketplaceMapPinFocusedLight,
  Stack,
  tokens,
  useTheme,
  useVexlTheme,
} from '@vexl-next/ui'
import {Array, Option, pipe, Schema} from 'effect'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type WritableAtom,
} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Dimensions, LayoutAnimation, StyleSheet} from 'react-native'
import MapView from 'react-native-map-clustering'
import {
  Marker,
  PROVIDER_GOOGLE,
  type Details,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import europeRegion from '../utils/europeRegion'
import {getMapTheme} from '../utils/mapStyle'

export interface Point<T> {
  data: T
  id: string
  latitude: Latitude
  longitude: Longitude
}

interface PinCoordinate {
  latitude: Latitude
  longitude: Longitude
}

interface PinMapMarkerProps {
  anchor: {x: number; y: number}
  cluster?: false
  coordinate: PinCoordinate
  identifier: string
  onPress: () => void
  tracksViewChanges: boolean
  zIndex: number | undefined
}

interface VisiblePoint<T> {
  isFocused: boolean
  point: Point<T>
  shouldCluster: boolean
}

interface Props<T> {
  mapPadding: EdgePadding
  pointsAtom: Atom<ReadonlyArray<Point<T>>>
  onPointPress: (p: Point<T>) => void
  pointIdsToFocusAtom: Atom<ReadonlyArray<Point<T>['id']> | undefined>
  onRegionChangeStart?: (region: Region, d: Details) => void
  onRegionChangeComplete?: (region: Region) => void
  onClusterPress?: (coordinates: readonly PinCoordinate[]) => void
  refAtom?: WritableAtom<null, [v: MapView | undefined], void>
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

const emptyRefAtom: WritableAtom<null, [MapView | undefined], void> = atom(
  null,
  () => {}
)
const PIN_MARKER_SIZE = 32
const PIN_MARKER_ASPECT_RATIO = 43 / 32
const PIN_MARKER_HEIGHT = PIN_MARKER_SIZE * PIN_MARKER_ASPECT_RATIO
const PIN_TRACKING_SETTLE_MS = 260
const emptyFocusedPointIds: readonly string[] = []

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.radius[3].val,
  },
})

export function getMapDisplayPointKey<T>({point}: {point: Point<T>}): string {
  return point.id
}

export function getMapDisplayMarkerKey<T>({
  point,
  shouldCluster,
}: {
  point: Point<T>
  shouldCluster: boolean
}): string {
  return `${point.id}-${shouldCluster ? 'clustered' : 'direct'}`
}

export function getVisibleMarkerPoints<T>({
  idsToFocus,
  points,
  showAllPointsInFocusMode,
}: {
  idsToFocus: ReadonlyArray<Point<T>['id']> | undefined
  points: ReadonlyArray<Point<T>>
  showAllPointsInFocusMode: boolean
}): ReadonlyArray<Point<T>> {
  const focusedPointIds = idsToFocus ?? emptyFocusedPointIds
  const isPointFocused = (point: Point<T>): boolean =>
    pipe(focusedPointIds, Array.contains(point.id))
  const isInFocusMode = pipe(points, Array.some(isPointFocused))

  if (!isInFocusMode || showAllPointsInFocusMode) return points

  return pipe(points, Array.filter(isPointFocused))
}

export function getVisibleMapPoints<T>({
  idsToFocus,
  points,
  showAllPointsInFocusMode,
}: {
  idsToFocus: ReadonlyArray<Point<T>['id']> | undefined
  points: ReadonlyArray<Point<T>>
  showAllPointsInFocusMode: boolean
}): ReadonlyArray<VisiblePoint<T>> {
  const focusedPointIds = idsToFocus ?? emptyFocusedPointIds
  const isPointFocused = (point: Point<T>): boolean =>
    pipe(focusedPointIds, Array.contains(point.id))

  return pipe(
    getVisibleMarkerPoints({idsToFocus, points, showAllPointsInFocusMode}),
    Array.map((point) => ({
      isFocused: isPointFocused(point),
      point,
      shouldCluster: !isPointFocused(point),
    }))
  )
}

export function getClusteredVisibleMapPoints<T>(
  visiblePoints: ReadonlyArray<VisiblePoint<T>>
): ReadonlyArray<VisiblePoint<T>> {
  return pipe(
    visiblePoints,
    Array.filter(({shouldCluster}) => shouldCluster)
  )
}

export function getDirectVisibleMapPoints<T>(
  visiblePoints: ReadonlyArray<VisiblePoint<T>>
): ReadonlyArray<VisiblePoint<T>> {
  return pipe(
    visiblePoints,
    Array.filter(({shouldCluster}) => !shouldCluster)
  )
}

export function getMapDisplayTrackingKey<T>(
  visiblePoints: ReadonlyArray<VisiblePoint<T>>
): string {
  return pipe(
    visiblePoints,
    Array.map(
      ({isFocused, point, shouldCluster}) =>
        `${getMapDisplayMarkerKey({point, shouldCluster})}:${isFocused ? 'focused' : 'default'}`
    ),
    Array.join('|')
  )
}

const ClusterLeafSchema = Schema.Struct({
  geometry: Schema.Struct({
    coordinates: Schema.Tuple(Longitude, Latitude),
  }),
})

export function getClusterLeavesCoordinates(
  leaves: readonly unknown[]
): readonly PinCoordinate[] {
  return pipe(
    leaves,
    Array.filterMap((leaf) =>
      pipe(
        Schema.decodeUnknownOption(ClusterLeafSchema)(leaf),
        Option.map(({geometry: {coordinates}}) => ({
          longitude: coordinates[0],
          latitude: coordinates[1],
        }))
      )
    )
  )
}

export function getMapPinImage({
  isFocused,
  resolvedTheme,
}: {
  isFocused: boolean
  resolvedTheme: 'dark' | 'light'
}): number {
  if (isFocused) {
    return resolvedTheme === 'dark'
      ? marketplaceMapPinFocusedDark
      : marketplaceMapPinFocusedLight
  }

  return resolvedTheme === 'dark'
    ? marketplaceMapPinDefaultDark
    : marketplaceMapPinDefaultLight
}

export function getPinMapMarkerProps<T>({
  clustered,
  isFocused,
  point,
  coordinate,
  emphasized = false,
  identifier = getMapDisplayPointKey({
    point,
  }),
  onPointPress,
  tracksViewChanges,
}: {
  clustered: boolean
  coordinate: PinCoordinate
  emphasized?: boolean
  identifier?: string
  isFocused: boolean
  onPointPress: (p: Point<T>) => void
  point: Point<T>
  tracksViewChanges: boolean
}): PinMapMarkerProps {
  const markerPropsBase = {
    anchor: {x: 0.5, y: 1},
    coordinate,
    identifier,
    onPress: () => {
      onPointPress(point)
    },
    tracksViewChanges,
    zIndex: emphasized ? 999 : undefined,
  }

  return clustered ? markerPropsBase : {...markerPropsBase, cluster: false}
}

function PinMapMarker<T>({
  clustered,
  coordinate,
  isFocused,
  onPointPress,
  point,
  resolvedTheme,
  tracksViewChanges,
}: {
  clustered: boolean
  coordinate: PinCoordinate
  isFocused: boolean
  onPointPress: (p: Point<T>) => void
  point: Point<T>
  resolvedTheme: 'dark' | 'light'
  tracksViewChanges: boolean
}): React.ReactElement {
  const image = getMapPinImage({isFocused, resolvedTheme})
  const markerProps = getPinMapMarkerProps({
    clustered,
    coordinate,
    emphasized: isFocused,
    isFocused,
    onPointPress,
    point,
    tracksViewChanges,
  })

  return (
    <Marker {...markerProps}>
      <Stack
        w={PIN_MARKER_SIZE}
        h={PIN_MARKER_HEIGHT}
        alignItems="center"
        justifyContent="center"
      >
        <Image
          source={image}
          width={PIN_MARKER_SIZE}
          height={PIN_MARKER_HEIGHT}
        />
      </Stack>
    </Marker>
  )
}

function MMapView({
  children,
  refAtom,
  mapPadding,
  onClusterPress,
  onMapReady,
  onRegionChangeStart,
  onRegionChangeComplete,
  tracksViewChanges,
}: {
  children: React.ReactNode
  refAtom?: WritableAtom<null, [v: MapView | undefined], void>
  mapPadding: EdgePadding
  onClusterPress?: (coordinates: readonly PinCoordinate[]) => void
  onMapReady?: () => void
  onRegionChangeStart?: (region: Region, d: Details) => void
  onRegionChangeComplete?: (region: Region) => void
  tracksViewChanges: boolean
}): React.ReactElement {
  const {resolvedTheme} = useVexlTheme()
  const theme = useTheme()
  const accentYellowPrimary = theme.accentYellowPrimary.get()
  const backgroundPrimary = theme.backgroundPrimary.get()
  const clusterTextColor =
    resolvedTheme === 'dark'
      ? theme.backgroundPrimary.get()
      : theme.foregroundPrimary.get()
  const ref = useRef<MapView>(null)
  // TODO: remove after update of react-native-map-clustering
  const dummySuperClusterRefFnc = useRef(null)
  const setMapViewRef = useSetAtom(refAtom ?? emptyRefAtom)
  const loadedCallbackCalledRef = useRef(false)

  const onMapLoaded = useCallback(() => {
    if (loadedCallbackCalledRef.current) return
    loadedCallbackCalledRef.current = true
    onMapReady?.()
  }, [onMapReady])

  const handleClusterPress = useCallback(
    (_cluster: unknown, leaves?: readonly unknown[]) => {
      onClusterPress?.(getClusterLeavesCoordinates(leaves ?? []))
    },
    [onClusterPress]
  )

  const handleRegionChangeStart = useCallback(
    (region: Region, details: Details) => {
      onRegionChangeStart?.(region, details)
    },
    [onRegionChangeStart]
  )

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      onRegionChangeComplete?.(region)
    },
    [onRegionChangeComplete]
  )

  useFocusEffect(
    useCallback(() => {
      setMapViewRef(ref.current ?? undefined)

      return () => {
        setMapViewRef(undefined)
      }
    }, [setMapViewRef])
  )

  useEffect(() => {
    setMapViewRef(ref.current ?? undefined)

    return () => {
      setMapViewRef(undefined)
    }
  }, [setMapViewRef])

  return (
    <MapView
      {...mapClusteringDefaultProps}
      ref={ref}
      superClusterRef={dummySuperClusterRefFnc}
      initialRegion={europeRegion}
      clusterColor={accentYellowPrimary}
      clusterTextColor={clusterTextColor}
      customMapStyle={getMapTheme(resolvedTheme)}
      onMapLoaded={onMapLoaded}
      layoutAnimationConf={{duration: 150}}
      minZoom={0}
      maxZoom={20}
      preserveClusterPressBehavior
      tracksViewChanges={tracksViewChanges}
      loadingBackgroundColor={backgroundPrimary}
      loadingIndicatorColor={accentYellowPrimary}
      clusteringEnabled
      loadingEnabled
      provider={PROVIDER_GOOGLE}
      mapPadding={mapPadding}
      toolbarEnabled={false}
      style={[styles.map, {backgroundColor: backgroundPrimary}]}
      onRegionChangeStart={handleRegionChangeStart}
      onRegionChangeComplete={handleRegionChangeComplete}
      onClusterPress={handleClusterPress}
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
  onRegionChangeStart,
  onRegionChangeComplete,
  onClusterPress,
  refAtom,
  onMapReady,
  showAllPointsInFocusMode = false,
}: Props<T>): React.ReactElement {
  const points = useAtomValue(pointsAtom)
  const idsToFocus = useAtomValue(pointIdsToFocusAtom)
  const {resolvedTheme} = useVexlTheme()
  const visiblePoints = getVisibleMapPoints({
    idsToFocus,
    points,
    showAllPointsInFocusMode,
  })
  const clusteredVisiblePoints = getClusteredVisibleMapPoints(visiblePoints)
  const directVisiblePoints = getDirectVisibleMapPoints(visiblePoints)
  const trackingKey = `${resolvedTheme}:${getMapDisplayTrackingKey(visiblePoints)}`
  const [settledTrackingKey, setSettledTrackingKey] = useState<string | null>(
    null
  )
  const tracksViewChanges = settledTrackingKey !== trackingKey
  useEffect(() => {
    const settleTimeout = setTimeout(() => {
      setSettledTrackingKey(trackingKey)
    }, PIN_TRACKING_SETTLE_MS)

    return () => {
      clearTimeout(settleTimeout)
    }
  }, [trackingKey])

  const markerElements = useMemo(
    () =>
      pipe(
        clusteredVisiblePoints,
        Array.appendAll(directVisiblePoints),
        Array.map(({isFocused, point, shouldCluster}) => (
          <PinMapMarker
            key={getMapDisplayMarkerKey({
              point,
              shouldCluster,
            })}
            clustered={shouldCluster}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            isFocused={isFocused}
            onPointPress={onPointPress}
            point={point}
            resolvedTheme={resolvedTheme}
            tracksViewChanges={tracksViewChanges}
          />
        ))
      ),
    [
      clusteredVisiblePoints,
      directVisiblePoints,
      onPointPress,
      resolvedTheme,
      tracksViewChanges,
    ]
  )

  return (
    <Stack w="100%" h="100%" position="relative">
      <MMapView
        refAtom={refAtom}
        mapPadding={mapPadding}
        onClusterPress={onClusterPress}
        onMapReady={onMapReady}
        onRegionChangeStart={onRegionChangeStart}
        onRegionChangeComplete={onRegionChangeComplete}
        tracksViewChanges={tracksViewChanges}
      >
        {markerElements}
      </MMapView>
    </Stack>
  )
}
