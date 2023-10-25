import TradeChecklistScreenWrapper from '../TradeChecklistScreenWrapper'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

type Props = TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>

function AgreeOnTradeDetailsScreen({
  route: {
    params: {chatId, inboxKey},
  },
}: Props): JSX.Element {
  return (
    <TradeChecklistScreenWrapper chatId={chatId} inboxKey={inboxKey}>
      <OnlineOrInPersonTrade />
    </TradeChecklistScreenWrapper>
  )
}

export default AgreeOnTradeDetailsScreen
