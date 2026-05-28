import {useFocusEffect} from '@react-navigation/native'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  MARKETPLACE_MAP_PIN_ASPECT_RATIO,
  MarketplaceMapPin,
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
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
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

interface MarkerClusteringControlProps {
  cluster?: false
}

interface VisiblePoint<T> {
  isFocused: boolean
  point: Point<T>
  shouldCluster: boolean
}

interface ClusterMarkerDimensions {
  readonly fontSize: number
  readonly height: number
  readonly size: number
  readonly width: number
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
const PIN_TRACKING_SETTLE_MS = 260
const PIN_MARKER_SIZE = 32
const PIN_MARKER_HEIGHT = PIN_MARKER_SIZE * MARKETPLACE_MAP_PIN_ASPECT_RATIO
const emptyFocusedPointIds: readonly string[] = []
const ANDROID_MARKER_REFRESH_MS = 900

const styles = StyleSheet.create({
  cluster: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  clusterContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  clusterText: {
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  clusterWrapper: {
    position: 'absolute',
    opacity: 0.5,
    zIndex: 0,
  },
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

export function getMapDisplayRenderedMarkerKey<T>({
  androidMarkerRefreshEpoch,
  point,
  shouldCluster,
}: {
  androidMarkerRefreshEpoch: number
  point: Point<T>
  shouldCluster: boolean
}): string {
  const baseKey = getMapDisplayMarkerKey({point, shouldCluster})

  if (androidMarkerRefreshEpoch <= 0) return baseKey

  return `${baseKey}-android-refresh-${androidMarkerRefreshEpoch}`
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

const ClusterMarkerSchema = Schema.Struct({
  geometry: Schema.Struct({
    coordinates: Schema.Tuple(Longitude, Latitude),
  }),
  id: Schema.Union(Schema.Number, Schema.String),
  properties: Schema.Struct({
    point_count: Schema.Number,
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

export function getMarkerClusteringControlProps({
  clustered,
}: {
  clustered: boolean
}): MarkerClusteringControlProps {
  return clustered ? {} : {cluster: false}
}

export function getPinMapMarkerProps<T>({
  clustered,
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

  return {
    ...markerPropsBase,
    ...getMarkerClusteringControlProps({clustered}),
  }
}

function getObjectProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined

  return Reflect.get(value, key)
}

function getFunctionObjectProperty(
  value: unknown,
  key: string
): (() => void) | undefined {
  const property = getObjectProperty(value, key)

  if (typeof property !== 'function') return undefined

  return () => {
    property()
  }
}

// react-native-map-clustering v4 passes its cluster tap handler to custom
// renderCluster output as cluster.onPress.
function getClusterMarkerOnPress(cluster: unknown): (() => void) | undefined {
  return getFunctionObjectProperty(cluster, 'onPress')
}

function getClusterMarkerDimensions(
  pointCount: number
): ClusterMarkerDimensions {
  if (pointCount >= 50) {
    return {fontSize: 20, height: 84, size: 64, width: 84}
  }

  if (pointCount >= 25) {
    return {fontSize: 19, height: 78, size: 58, width: 78}
  }

  if (pointCount >= 15) {
    return {fontSize: 18, height: 72, size: 54, width: 72}
  }

  if (pointCount >= 10) {
    return {fontSize: 17, height: 66, size: 50, width: 66}
  }

  if (pointCount >= 8) {
    return {fontSize: 17, height: 60, size: 46, width: 60}
  }

  if (pointCount >= 4) {
    return {fontSize: 16, height: 54, size: 40, width: 54}
  }

  return {fontSize: 15, height: 48, size: 36, width: 48}
}

function getClusterRenderKey({
  androidMarkerRefreshEpoch,
  cluster,
}: {
  androidMarkerRefreshEpoch: number
  cluster: unknown
}): string {
  return pipe(
    Schema.decodeUnknownOption(ClusterMarkerSchema)(cluster),
    Option.match({
      onNone: () =>
        `cluster-unknown-android-refresh-${androidMarkerRefreshEpoch}`,
      onSome: ({id}) =>
        `cluster-${String(id)}-android-refresh-${androidMarkerRefreshEpoch}`,
    })
  )
}

// Android map markers snapshot their children into bitmaps. Keep this cluster
// bubble in plain React Native View/Text; Tamagui text can be captured blank.
function ClusterMarker({
  androidMarkerRefreshEpoch,
  cluster,
  clusterColor,
  clusterTextColor,
  tracksViewChanges,
}: {
  androidMarkerRefreshEpoch: number
  cluster: unknown
  clusterColor: string
  clusterTextColor: string
  tracksViewChanges: boolean
}): React.ReactElement | null {
  return pipe(
    Schema.decodeUnknownOption(ClusterMarkerSchema)(cluster),
    Option.match({
      onNone: () => null,
      onSome: ({
        geometry: {coordinates},
        id,
        properties: {point_count: pointCount},
      }) => {
        const {fontSize, height, size, width} =
          getClusterMarkerDimensions(pointCount)
        const onPress = getClusterMarkerOnPress(cluster)

        return (
          <Marker
            key={`cluster-${String(id)}-android-refresh-${androidMarkerRefreshEpoch}`}
            coordinate={{
              longitude: coordinates[0],
              latitude: coordinates[1],
            }}
            identifier={`cluster-${String(id)}`}
            onPress={onPress}
            tracksViewChanges={tracksViewChanges}
            zIndex={pointCount + 1}
          >
            <View
              collapsable={false}
              style={[styles.clusterContainer, {width, height}]}
            >
              <View
                collapsable={false}
                style={[
                  styles.clusterWrapper,
                  {
                    backgroundColor: clusterColor,
                    borderRadius: width / 2,
                    height,
                    width,
                  },
                ]}
              />
              <View
                collapsable={false}
                style={[
                  styles.cluster,
                  {
                    backgroundColor: clusterColor,
                    borderRadius: size / 2,
                    height: size,
                    width: size,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.clusterText,
                    {
                      color: clusterTextColor,
                      fontSize,
                      lineHeight: fontSize + 2,
                    },
                  ]}
                >
                  {pointCount}
                </Text>
              </View>
            </View>
          </Marker>
        )
      },
    })
  )
}

function MMapView({
  children,
  androidMarkerRefreshEpoch,
  refAtom,
  mapPadding,
  onClusterPress,
  onMapReady,
  onRegionChangeStart,
  onRegionChangeComplete,
  tracksViewChanges,
}: {
  children: React.ReactNode
  androidMarkerRefreshEpoch: number
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

  const renderCluster = useCallback(
    (cluster: unknown) => (
      <ClusterMarker
        key={getClusterRenderKey({androidMarkerRefreshEpoch, cluster})}
        androidMarkerRefreshEpoch={androidMarkerRefreshEpoch}
        cluster={cluster}
        clusterColor={accentYellowPrimary}
        clusterTextColor={clusterTextColor}
        tracksViewChanges={tracksViewChanges}
      />
    ),
    [
      accentYellowPrimary,
      androidMarkerRefreshEpoch,
      clusterTextColor,
      tracksViewChanges,
    ]
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
      googleRenderer={Platform.OS === 'android' ? 'LEGACY' : undefined}
      spiralEnabled={false}
      loadingEnabled
      provider={PROVIDER_GOOGLE}
      mapPadding={mapPadding}
      toolbarEnabled={false}
      style={[styles.map, {backgroundColor: backgroundPrimary}]}
      onRegionChangeStart={handleRegionChangeStart}
      onRegionChangeComplete={handleRegionChangeComplete}
      onClusterPress={handleClusterPress}
      renderCluster={renderCluster}
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
  const theme = useTheme()
  const pinColor = theme.foregroundPrimary.get()
  const pinCenterColor = theme.backgroundPrimary.get()
  const focusedPinColor = theme.accentHighlightSecondary.get()
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
  const [androidMarkerRefreshEpoch, setAndroidMarkerRefreshEpoch] = useState(0)
  const [androidMarkerRefreshActive, setAndroidMarkerRefreshActive] =
    useState(false)
  const tracksViewChanges =
    settledTrackingKey !== trackingKey || androidMarkerRefreshActive

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined

      setAndroidMarkerRefreshActive(true)
      setAndroidMarkerRefreshEpoch((current) => current + 1)

      const settleTimeout = setTimeout(() => {
        setAndroidMarkerRefreshActive(false)
      }, ANDROID_MARKER_REFRESH_MS)

      return () => {
        clearTimeout(settleTimeout)
        setAndroidMarkerRefreshActive(false)
      }
    }, [])
  )

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
        Array.map(({isFocused, point, shouldCluster}) => {
          const markerProps = getPinMapMarkerProps({
            clustered: shouldCluster,
            coordinate: {
              latitude: point.latitude,
              longitude: point.longitude,
            },
            emphasized: isFocused,
            onPointPress,
            point,
            tracksViewChanges,
          })
          const markerColor = isFocused ? focusedPinColor : pinColor

          return (
            <Marker
              key={getMapDisplayRenderedMarkerKey({
                androidMarkerRefreshEpoch,
                point,
                shouldCluster,
              })}
              {...markerProps}
            >
              <Stack
                h={PIN_MARKER_HEIGHT}
                w={PIN_MARKER_SIZE}
                alignItems="center"
                justifyContent="center"
              >
                <MarketplaceMapPin
                  centerColor={pinCenterColor}
                  color={markerColor}
                  width={PIN_MARKER_SIZE}
                  height={PIN_MARKER_HEIGHT}
                />
              </Stack>
            </Marker>
          )
        })
      ),
    [
      clusteredVisiblePoints,
      directVisiblePoints,
      focusedPinColor,
      androidMarkerRefreshEpoch,
      onPointPress,
      pinCenterColor,
      pinColor,
      tracksViewChanges,
    ]
  )

  return (
    <Stack w="100%" h="100%" position="relative">
      <MMapView
        androidMarkerRefreshEpoch={androidMarkerRefreshEpoch}
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
