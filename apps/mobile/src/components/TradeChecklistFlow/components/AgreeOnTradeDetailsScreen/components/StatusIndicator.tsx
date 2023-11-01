import {getTokens, Stack} from 'tamagui'
import {type TradeChecklistItemStatus} from '../../../domain'
import Image from '../../../../Image'
import pendingSvg from '../../../../../images/pendingSvg'

interface Props {
  itemStatus: TradeChecklistItemStatus
}

function StatusIndicator({itemStatus}: Props): JSX.Element {
  return (
    <Stack
      ai={'center'}
      jc={'center'}
      w={24}
      h={24}
      borderWidth={itemStatus === 'unknown' ? 1 : 0}
      boc={'$greyAccent3'}
      br={'$2'}
      bc={itemStatus === 'pending' ? '$yellowAccent2' : 'transparent'}
    >
      {itemStatus === 'pending' ? (
        <Image
          height={12}
          width={12}
          source={pendingSvg}
          stroke={getTokens().color.main.val}
        />
      ) : (
        <></>
      )}
    </Stack>
  )
}

export default StatusIndicator
