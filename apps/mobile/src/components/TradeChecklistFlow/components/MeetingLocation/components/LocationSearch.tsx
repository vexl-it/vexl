import React from 'react'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import LocationSearch from '../../../../LocationSearch'
import {newLocationSessionId} from '../../../../LocationSearch/molecule'
import {TradeChecklistItemPageLayout} from '../../TradeChecklistItemPageLayout'

type Props = TradeChecklistStackScreenProps<'LocationSearch'>

export default function LocationMapSearch({
  navigation,
}: Props): React.ReactElement {
  return (
    <TradeChecklistItemPageLayout
      header={{
        title: '',
      }}
      scrollable={false}
    >
      <Stack f={1}>
        <LocationSearch
          sessionId={newLocationSessionId()}
          onPress={({locationData, searchQuery}) => {
            navigation.navigate('LocationMapSelect', {
              selectedLocation: locationData,
              searchQuery,
            })
          }}
        />
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}
