import {
  Camera,
  GeoJSONSource,
  Images,
  Layer,
  type CameraRef,
  type CircleLayerSpecification,
  type GeoJSONSourceRef,
  type PressEventWithFeatures,
  type SymbolLayerSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native'
import {useFocusEffect} from '@react-navigation/native'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {tokens, useTheme, useVexlTheme} from '@vexl-next/ui'
import {Array, Option, pipe, Schema} from 'effect'
import {useAtomValue, useSetAtom, type Atom, type WritableAtom} from 'jotai'
import React, {useCallback, useMemo, useRef} from 'react'
import {StyleSheet, type NativeSyntheticEvent} from 'react-native'
import reportError from '../../../utils/reportError'
import {
  type EdgePadding,
  type MapCameraControls,
  type Region,
  type RegionChangeDetails,
} from '../types'
import europeRegion from '../utils/europeRegion'
import {regionToBounds, viewStateToRegion} from '../utils/mapLibreRegion'
import VexlMap from './VexlMap'

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

interface Props<T> {
  mapPadding: EdgePadding
  pointsAtom: Atom<ReadonlyArray<Point<T>>>
  onPointPress: (p: Point<T>) => void
  pointIdsToFocusAtom: Atom<ReadonlyArray<Point<T>['id']> | undefined>
  onRegionChangeComplete?: (region: Region, d: RegionChangeDetails) => void
  onClusterPress?: (coordinates: readonly PinCoordinate[]) => void
  // Presses on pins and clusters stop propagation, so this only fires for
  // presses on the map itself.
  onMapPress?: () => void
  refAtom: WritableAtom<null, [v: MapCameraControls | undefined], void>
  onMapReady?: () => void
}

const CAMERA_ANIMATION_DURATION_MS = 500
const MAX_ZOOM = 20
const CLUSTER_RADIUS = 25
const europeBounds = regionToBounds(europeRegion)

const pinImages = {
  light: require('../img/marketplace-pin-light.png'),
  lightFocused: require('../img/marketplace-pin-light-focused.png'),
  dark: require('../img/marketplace-pin-dark.png'),
  darkFocused: require('../img/marketplace-pin-dark-focused.png'),
}

const styles = StyleSheet.create({
  map: {
    borderRadius: tokens.radius[3].val,
  },
})

const offerPinLayout: SymbolLayerSpecification['layout'] = {
  'icon-image': 'marketplace-pin',
  'icon-anchor': 'bottom',
  'icon-allow-overlap': true,
  'icon-ignore-placement': true,
}

const focusedOfferPinLayout: SymbolLayerSpecification['layout'] = {
  ...offerPinLayout,
  'icon-image': 'marketplace-pin-focused',
}

// Cluster bubble sizes mirror the previous native cluster markers: core circle
// 36-64 px and halo 48-84 px in diameter, text 15-20 pt, stepped by count.
const clusterCountLayout: SymbolLayerSpecification['layout'] = {
  'text-field': ['to-string', ['get', 'point_count']],
  'text-font': ['Noto Sans Regular'],
  'text-size': [
    'step',
    ['get', 'point_count'],
    15,
    4,
    16,
    8,
    17,
    15,
    18,
    25,
    19,
    50,
    20,
  ],
  'text-allow-overlap': true,
}

function getClusterHaloPaint(color: string): CircleLayerSpecification['paint'] {
  return {
    'circle-color': color,
    'circle-opacity': 0.5,
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      24,
      4,
      27,
      8,
      30,
      10,
      33,
      15,
      36,
      25,
      39,
      50,
      42,
    ],
  }
}

function getClusterCorePaint(color: string): CircleLayerSpecification['paint'] {
  return {
    'circle-color': color,
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      18,
      4,
      20,
      8,
      23,
      10,
      25,
      15,
      27,
      25,
      29,
      50,
      32,
    ],
  }
}

function getClusterCountPaint(
  color: string
): SymbolLayerSpecification['paint'] {
  return {
    'text-color': color,
  }
}

function pointToFeature<T>(point: Point<T>): GeoJSON.Feature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.longitude, point.latitude],
    },
    properties: {id: point.id},
  }
}

function pointsToFeatureCollection<T>(
  points: ReadonlyArray<Point<T>>
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pipe(points, Array.map(pointToFeature)),
  }
}

const ClusterFeatureSchema = Schema.Struct({
  properties: Schema.Struct({
    cluster_id: Schema.Number,
    point_count: Schema.Number,
  }),
})

const PointFeatureSchema = Schema.Struct({
  properties: Schema.Struct({
    id: Schema.String,
  }),
})

const ClusterLeafSchema = Schema.Struct({
  geometry: Schema.Struct({
    coordinates: Schema.Tuple(Longitude, Latitude),
  }),
})

function getClusterLeavesCoordinates(
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

export default function MapDisplayMultiplePoints<T>({
  pointIdsToFocusAtom,
  mapPadding,
  onPointPress,
  pointsAtom,
  onRegionChangeComplete,
  onClusterPress,
  onMapPress,
  refAtom,
  onMapReady,
}: Props<T>): React.ReactElement {
  const points = useAtomValue(pointsAtom)
  const idsToFocus = useAtomValue(pointIdsToFocusAtom)
  const {resolvedTheme} = useVexlTheme()
  const theme = useTheme()
  const accentYellowPrimary = theme.accentYellowPrimary.get()
  const clusterTextColor =
    resolvedTheme === 'dark'
      ? theme.backgroundPrimary.get()
      : theme.foregroundPrimary.get()

  const cameraRef = useRef<CameraRef>(null)
  const clusteredSourceRef = useRef<GeoJSONSourceRef>(null)
  const setCameraControls = useSetAtom(refAtom)
  const loadedCallbackCalledRef = useRef(false)

  const {clusteredCollection, focusedCollection} = useMemo(() => {
    const focusedPointIds = idsToFocus ?? []
    const [clusteredPoints, focusedPoints] = pipe(
      points,
      Array.partition((point) =>
        pipe(focusedPointIds, Array.contains(point.id))
      )
    )

    return {
      clusteredCollection: pointsToFeatureCollection(clusteredPoints),
      focusedCollection: pointsToFeatureCollection(focusedPoints),
    }
  }, [idsToFocus, points])

  const cameraControls = useMemo<MapCameraControls>(
    () => ({
      fitBounds: (bounds, options) => {
        cameraRef.current?.fitBounds(bounds, {
          padding: options?.padding,
          duration: CAMERA_ANIMATION_DURATION_MS,
          easing: 'ease',
        })
      },
    }),
    []
  )

  useFocusEffect(
    useCallback(() => {
      setCameraControls(cameraControls)

      return () => {
        setCameraControls(undefined)
      }
    }, [cameraControls, setCameraControls])
  )

  const onMapLoaded = useCallback(() => {
    if (loadedCallbackCalledRef.current) return
    loadedCallbackCalledRef.current = true
    onMapReady?.()
  }, [onMapReady])

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      onRegionChangeComplete?.(viewStateToRegion(event.nativeEvent), {
        isGesture: event.nativeEvent.userInteraction,
      })
    },
    [onRegionChangeComplete]
  )

  const handleSourcePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const feature = event.nativeEvent.features[0]
      if (!feature) return

      event.stopPropagation()

      const cluster = Schema.decodeUnknownOption(ClusterFeatureSchema)(feature)
      if (Option.isNone(cluster)) {
        pipe(
          Schema.decodeUnknownOption(PointFeatureSchema)(feature),
          Option.flatMap(({properties: {id}}) =>
            pipe(
              points,
              Array.findFirst((point) => point.id === id)
            )
          ),
          Option.map((point) => {
            onPointPress(point)
            return point
          })
        )
        return
      }

      const source = clusteredSourceRef.current
      if (!source) return

      void source
        .getClusterLeaves(
          cluster.value.properties.cluster_id,
          cluster.value.properties.point_count,
          0
        )
        .then((leaves) => {
          onClusterPress?.(getClusterLeavesCoordinates(leaves))
        })
        .catch((error: unknown) => {
          reportError(
            'warn',
            new Error('Error while reading map cluster leaves', {
              cause: error,
            }),
            {error}
          )
        })
    },
    [onClusterPress, onPointPress, points]
  )

  return (
    <VexlMap
      contentInset={mapPadding}
      style={styles.map}
      onDidFinishLoadingMap={onMapLoaded}
      onDidFailLoadingMap={onMapLoaded}
      onRegionDidChange={handleRegionDidChange}
      onPress={onMapPress}
    >
      <Camera
        ref={cameraRef}
        maxZoom={MAX_ZOOM}
        initialViewState={{bounds: europeBounds}}
      />
      <Images
        images={{
          'marketplace-pin':
            resolvedTheme === 'dark' ? pinImages.dark : pinImages.light,
          'marketplace-pin-focused':
            resolvedTheme === 'dark'
              ? pinImages.darkFocused
              : pinImages.lightFocused,
        }}
      />
      <GeoJSONSource
        ref={clusteredSourceRef}
        id="clustered-offer-points"
        data={clusteredCollection}
        cluster
        clusterRadius={CLUSTER_RADIUS}
        // Source tiles must exist one zoom past the last clustered zoom so
        // clusters actually break apart before the camera's max zoom.
        maxzoom={MAX_ZOOM}
        clusterMaxZoom={MAX_ZOOM - 1}
        onPress={handleSourcePress}
      >
        <Layer
          type="circle"
          id="offer-cluster-halos"
          filter={['has', 'point_count']}
          paint={getClusterHaloPaint(accentYellowPrimary)}
        />
        <Layer
          type="circle"
          id="offer-cluster-cores"
          filter={['has', 'point_count']}
          paint={getClusterCorePaint(accentYellowPrimary)}
        />
        <Layer
          type="symbol"
          id="offer-cluster-counts"
          filter={['has', 'point_count']}
          layout={clusterCountLayout}
          paint={getClusterCountPaint(clusterTextColor)}
        />
        <Layer
          type="symbol"
          id="offer-pins"
          filter={['!', ['has', 'point_count']]}
          layout={offerPinLayout}
        />
      </GeoJSONSource>
      <GeoJSONSource
        id="focused-offer-points"
        data={focusedCollection}
        onPress={handleSourcePress}
      >
        {/* Pinned above the clustered layers explicitly: Android re-adds
            sources in hash order after a style reload (theme switch). */}
        <Layer
          type="symbol"
          id="focused-offer-pins"
          afterId="offer-pins"
          layout={focusedOfferPinLayout}
        />
      </GeoJSONSource>
    </VexlMap>
  )
}
