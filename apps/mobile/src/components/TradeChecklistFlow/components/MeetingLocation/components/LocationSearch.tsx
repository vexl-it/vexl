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

export default function LocationMapSearch({navigation}: Props): JSX.Element {
  return (
    <>
      <HeaderProxy />
      <Content>
        <LocationSearch
          sessionId={newLocationSessionId()}
          onPress={(data) => {
            navigation.navigate('LocationMapSelect', {
              selectedLocation: data,
            })
          }}
        />
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy hidden />
    </>
  )
}
