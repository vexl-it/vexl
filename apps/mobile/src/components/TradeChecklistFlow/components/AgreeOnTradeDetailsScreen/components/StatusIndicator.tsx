import {type TradeChecklistItemStatus} from '@vexl-next/domain/dist/general/tradeChecklist'
import {getTokens, Stack} from 'tamagui'
import pendingSvg from '../../../../../images/pendingSvg'
import Checkbox from '../../../../Checkbox'
import Image from '../../../../Image'
import warningSvg from '../../../../ChatDetailScreen/images/warningSvg'

interface Props {
  itemStatus: TradeChecklistItemStatus
}

function empty(): void {}

function StatusIndicator({itemStatus}: Props): JSX.Element {
  return (
    <Stack
      ai={'center'}
      jc={'center'}
      w={24}
      h={24}
      borderWidth={itemStatus !== 'initial' ? 0 : 1}
      boc={'$greyAccent3'}
      br={'$2'}
      bc={
        ['readyToSend', 'pending'].includes(itemStatus)
          ? '$yellowAccent2'
          : itemStatus === 'warning'
          ? '$pink'
          : 'transparent'
      }
    >
      {['readyToSend', 'pending'].includes(itemStatus) ? (
        <Image
          height={12}
          width={12}
          source={pendingSvg}
          stroke={getTokens().color.main.val}
        />
      ) : itemStatus === 'warning' ? (
        <Image stroke="black" height={18} width={18} source={warningSvg} />
      ) : itemStatus === 'accepted' ? (
        <Checkbox size={'24x24'} value={true} onChange={empty} />
      ) : (
        <></>
      )}
    </Stack>
  )
}

export default StatusIndicator
