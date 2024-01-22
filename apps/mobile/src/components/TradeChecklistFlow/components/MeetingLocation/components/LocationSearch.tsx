import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import LocationSearch from '../../../../LocationSearch'
import {newLocationSessionId} from '../../../../LocationSearch/molecule'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../PageWithNavigationHeader'
import Content from '../../Content'

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
