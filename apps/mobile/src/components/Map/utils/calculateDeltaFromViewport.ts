import {Dimensions} from 'react-native'
import {type Viewport} from '../brands'

export default function calculateDeltaFromViewport(viewport: Viewport): {
  latitudeDelta: number
  longitudeDelta: number
} {
  const {width, height} = Dimensions.get('window')

  const ASPECT_RATIO = width / height

  const latitudeDelta =
    viewport.northeast.latitude - viewport.southwest.latitude
  const longitudeDelta = latitudeDelta * ASPECT_RATIO

  return {
    latitudeDelta,
    longitudeDelta,
  }
}
