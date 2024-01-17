import LocationSearch from '../../../../LocationSearch'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../PageWithNavigationHeader'
import Content from '../../Content'
import {newLocationSessionId} from '../../../../LocationSearch/molecule'

type Props = TradeChecklistStackScreenProps<'LocationSearch'>

const empty = (): void => {}

export default function LocationMapSearch({
  navigation,
  route: {
    params: {submitUpdateOnPick},
  },
}: Props): JSX.Element {
  return (
    <>
      <HeaderProxy />
      <Content>
        <LocationSearch
          sessionId={newLocationSessionId()}
          onPress={(data) => {
            navigation.navigate('LocationMapSelect', {
              selectedLocation: data,
              submitUpdateOnPick,
            })
          }}
        />
      </Content>
      <FooterButtonProxy text="" onPress={empty} hidden />
    </>
  )
}
