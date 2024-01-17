import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {ScopeProvider} from 'bunshi/dist/react'
import React from 'react'
import LocationsList from './components/LocationList'
import LocationSearchInput from './components/LocationSearchInput'
import {LocationSearchScope, type LocationSessionId} from './molecule'

interface Props {
  onPress: (locationData: LocationSuggestion) => void
  sessionId: LocationSessionId
}

function LocationSearch({onPress, sessionId}: Props): JSX.Element {
  return (
    <ScopeProvider scope={LocationSearchScope} value={{sessionId}}>
      <LocationSearchInput />
      <LocationsList onPress={onPress} />
    </ScopeProvider>
  )
}

export default LocationSearch
