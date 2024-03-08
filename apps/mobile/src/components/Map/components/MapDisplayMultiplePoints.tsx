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
  type PrimitiveAtom,
} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {Fragment, useCallback, useEffect, useMemo, useRef} from 'react'
import {Image} from 'react-native'
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  type Details,
  type EdgePadding,
  type Region,
} from 'react-native-maps'
import {Stack, getTokens} from 'tamagui'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
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
  refAtom?: PrimitiveAtom<MapView | undefined>
  onMapReady?: () => void
}

const empty = (): void => {}
const emptyAtom = atom<MapView | undefined>(undefined)

const mapStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: 'black',
} as const

function MMapView({
  children,
  refAtom,
  mapPadding,
  onMapReady,
  onRegionChangeComplete,
}: {
  children: React.ReactNode
  refAtom: PrimitiveAtom<MapView | undefined> | undefined
  mapPadding: EdgePadding
  onMapReady?: () => void
  onRegionChangeComplete?: (region: Region, d: Details) => void
}): JSX.Element {
  const ref = useRef<MapView>(null)
  const setMapViewRef = useSetAtom(refAtom ?? emptyAtom)
  const loadedCallbackCalledRef = useRef(false)

  const onMapLoaded = useCallback(() => {
    if (loadedCallbackCalledRef.current) return
    loadedCallbackCalledRef.current = true
    onMapReady?.()
  }, [onMapReady])

  useEffect(() => {
    setMapViewRef(ref.current ?? undefined)
  }, [ref, setMapViewRef])

  return (
    <MapView
      ref={ref}
      initialRegion={europeRegion}
      maxZoomLevel={15}
      customMapStyle={mapTheme}
      onMapLoaded={onMapLoaded}
      loadingBackgroundColor="#000000"
      loadingIndicatorColor={getTokens().color.main.val}
      loadingEnabled
      provider={PROVIDER_GOOGLE}
      mapPadding={mapPadding}
      toolbarEnabled={false}
      style={mapStyle}
      onRegionChangeComplete={onRegionChangeComplete ?? empty}
    >
      {children}
    </MapView>
  )
}

function Point<T>({
  atom: pointAtom,
  pointsIdsToFocusAtom,
  onPointPress,
}: {
  atom: Atom<Point<T>>
  pointsIdsToFocusAtom: Props<T>['pointIdsToFocusAtom']
  onPointPress: Props<T>['onPointPress']
}): JSX.Element {
  const point = useAtomValue(pointAtom)
  const isFocused = useAtomValue(
    useMemo(() => {
      return atom((get) => {
        const {id} = get(pointAtom)
        const ids = get(pointsIdsToFocusAtom)
        return ids?.includes(id) ?? false
      })
    }, [pointAtom, pointsIdsToFocusAtom])
  )

  return (
    <Fragment key={point.id}>
      <Marker
        key={point.id}
        coordinate={{
          latitude: point.latitude,
          longitude: point.longitude,
        }}
        onPress={() => {
          onPointPress(point)
        }}
      >
        {!isFocused ? (
          <Stack w={20} h={20} alignItems="center" justifyContent="center">
            <Stack w={8} h={8} borderRadius={4} bg="$main" />
          </Stack>
        ) : (
          <Image source={markerImage} />
        )}
      </Marker>
      {!!isFocused && (
        <Circle
          fillColor={`${getTokens().color.main.val}22`}
          strokeColor={getTokens().color.main.val}
          center={point}
          radius={longitudeDeltaToMeters(point.radius, point.latitude)}
        ></Circle>
      )}
    </Fragment>
  )
}

function Points<T>({
  pointsAtom,
  onPointPress,
  pointIdsToFocusAtom,
}: {
  pointsAtom: Props<T>['pointsAtom']
  onPointPress: Props<T>['onPointPress']
  pointIdsToFocusAtom: Props<T>['pointIdsToFocusAtom']
}): JSX.Element {
  const pointsAtoms = useAtomValue(
    useMemo(() => splitAtom(pointsAtom), [pointsAtom])
  )

  return (
    <>
      {pointsAtoms.map((atom) => {
        return (
          <Point
            key={atomKeyExtractor(atom)}
            atom={atom}
            onPointPress={onPointPress}
            pointsIdsToFocusAtom={pointIdsToFocusAtom}
          ></Point>
        )
      })}
    </>
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
}: Props<T>): JSX.Element {
  return (
    <Stack w="100%" h="100%" position="relative">
      <MMapView
        refAtom={refAtom}
        mapPadding={mapPadding}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        <Points
          onPointPress={onPointPress}
          pointIdsToFocusAtom={pointIdsToFocusAtom}
          pointsAtom={pointsAtom}
        />
      </MMapView>
    </Stack>
  )
}
