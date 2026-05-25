import {useRoute, type RouteProp} from '@react-navigation/native'
import React from 'react'
import {type RootStackParamsList} from '../../../navigationTypes'
import LocationSearchPicker from '../../LocationPicker/LocationSearchPicker'

export default function OfferLocationSearchScreen(): React.ReactElement {
  const route =
    useRoute<RouteProp<RootStackParamsList, 'OfferLocationSearch'>>()

  return (
    <LocationSearchPicker
      radiusRouteName="OfferLocationRadius"
      radiusRouteParams={{
        randomizeLocation: route.params?.randomizeLocation,
      }}
    />
  )
}
