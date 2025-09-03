import {useFocusEffect} from '@react-navigation/native'
import {
  longitudeDeltaToMeters,
  type Latitude,
  type Longitude,
  type Radius,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type WritableAtom,
} from 'jotai'
import React, {Fragment, useCallback, useRef} from 'react'
import {Dimensions, LayoutAnimation, Platform} from 'react-native'
import MapView from 'react-native-map-clustering'
import {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  type Details,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import {Stack, getTokens, useDebounce} from 'tamagui'
import europeRegion from '../utils/europeRegion'
import mapTheme from '../utils/mapStyle'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const markerImage = require('../img/pin.png')

export interface Point<T> {
  data: T
  id: string
  latitude: Latitude
  longitude: Longitude
  radius: Radius
}

interface Props<T> {
  mapPadding: EdgePadding
  pointsAtom: Atom<Array<Point<T>>>
  onPointPress: (p: Point<T>) => void
  pointIdsToFocusAtom: Atom<Array<Point<T>['id']> | undefined>
  onRegionChangeComplete?: (region: Region, d: Details) => void
  refAtom?: WritableAtom<null, [v: MapView], void>
  onMapReady?: () => void
}

// TODO: remove all dummy refs and func after react-native-map-clustering update to newer version
// as default props do not work in new version of react therefore this causes errors after update do EXPO 53
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
  clusterColor: '#00B386',
  clusterTextColor: '#FFFFFF',
  spiderLineColor: '#FF0000',
  // Callbacks
  onRegionChangeComplete: () => {},
  onClusterPress: () => {},
  onMarkersChange: () => {},
  superClusterRef: {},
  mapRef: () => {},
}

const emptyAtom = atom<MapView | undefined>(undefined)

const mapStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: 'black',
  borderRadius: getTokens().radius[3].val,
} as const

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
    500
  )

  return (
    <MapView
      {...mapClusteringDefaultProps}
      ref={ref}
      superClusterRef={dummySuperClusterRefFnc}
      initialRegion={europeRegion}
      clusterColor={
        inFocusMode
          ? getTokens().color.greyAccent1.val
          : getTokens().color.main.val
      }
      customMapStyle={mapTheme}
      onMapLoaded={onMapLoaded}
      layoutAnimationConf={{duration: 150}}
      minZoom={0}
      maxZoom={20}
      loadingBackgroundColor="#000000"
      loadingIndicatorColor={
        inFocusMode
          ? getTokens().color.greyAccent1.val
          : getTokens().color.main.val
      }
      clusteringEnabled
      loadingEnabled
      provider={PROVIDER_GOOGLE}
      mapPadding={mapPadding}
      toolbarEnabled={false}
      style={mapStyle}
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
}: Props<T>): React.ReactElement {
  const points = useAtomValue(pointsAtom)
  const idsToFocus = useAtomValue(pointIdsToFocusAtom)
  const {focusedPoints, notFocusedPoints} = points.reduce(
    (acc, point) => {
      const isFocused = idsToFocus?.includes(point.id)
      if (isFocused) {
        acc.focusedPoints.push(point)
      } else {
        acc.notFocusedPoints.push(point)
      }
      return acc
    },
    {
      focusedPoints: [] as Array<Point<T>>,
      notFocusedPoints: [] as Array<Point<T>>,
    }
  )

  const isInFocusMode = focusedPoints.length > 0

  return (
    <Stack w="100%" h="100%" position="relative">
      <MMapView
        inFocusMode={isInFocusMode}
        refAtom={refAtom}
        mapPadding={mapPadding}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {!isInFocusMode &&
          notFocusedPoints.map((point) => {
            return (
              <Marker
                key={point.id}
                // https://github.com/react-native-maps/react-native-maps/issues/4997
                tracksViewChanges={Platform.OS === 'ios'}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                onPress={() => {
                  onPointPress(point)
                }}
              >
                <Stack
                  w={28}
                  h={28}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Stack
                    w={8}
                    h={8}
                    borderRadius={4}
                    bg={isInFocusMode ? '$greyOnBlack' : '$main'}
                  />
                </Stack>
              </Marker>
            )
          })}
        {focusedPoints.map((point) => {
          return (
            <Fragment key={point.id}>
              <Marker
                zIndex={999}
                //  https://github.com/react-native-maps/react-native-maps/issues/4997
                tracksViewChanges={Platform.OS === 'ios'}
                image={markerImage}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
              ></Marker>
              <Circle
                fillColor={`${getTokens().color.main.val}22`}
                strokeColor={getTokens().color.main.val}
                center={point}
                radius={longitudeDeltaToMeters(point.radius, point.latitude)}
              />
            </Fragment>
          )
        })}
      </MMapView>
    </Stack>
  )
}
