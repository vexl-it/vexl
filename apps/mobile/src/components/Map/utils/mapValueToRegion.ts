import {type Region} from 'react-native-maps'
import {type MapValue} from '../brands'

export default function mapValueToRegion(mapValue: MapValue): Region {
  return {
    latitude: mapValue.latitude,
    longitude: mapValue.longitude,
    latitudeDelta: Math.abs(
      mapValue.viewport.northeast.latitude -
        mapValue.viewport.southwest.latitude
    ),
    longitudeDelta: Math.abs(
      mapValue.viewport.northeast.longitude -
        mapValue.viewport.southwest.longitude
    ),
  }
}
