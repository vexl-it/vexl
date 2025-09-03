import React from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import LocationSearch from '../../../../LocationSearch'
import {newLocationSessionId} from '../../../../LocationSearch/molecule'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../PageWithNavigationHeader'
import Content from '../../Content'

type Props = TradeChecklistStackScreenProps<'LocationSearch'>

export default function LocationMapSearch({
  navigation,
}: Props): React.ReactElement {
  return (
    <>
      <HeaderProxy />
      <Content>
        <LocationSearch
          sessionId={newLocationSessionId()}
          onPress={({locationData, searchQuery}) => {
            navigation.navigate('LocationMapSelect', {
              selectedLocation: locationData,
              searchQuery,
            })
          }}
        />
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy hidden />
    </>
  )
}
