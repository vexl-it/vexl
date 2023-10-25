import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {type TradeChecklistItemStatus} from '../../../../../state/chat/domain'
import StatusIndicator from './StatusIndicator'
import Image from '../../../../Image'
import chevronRightSvg from '../../../../../images/chevronRightSvg'

interface Props extends TouchableOpacityProps {
  itemStatus: TradeChecklistItemStatus
  title: string
  subtitle?: string
  sideNote?: string
}

function ChecklistCell({sideNote, subtitle, title}: Props): JSX.Element {
  return (
    <TouchableOpacity>
      <XStack
        ai={'center'}
        jc={'space-between'}
        bc={'$grey'}
        px={'$4'}
        py={'$5'}
        br={'$4'}
      >
        <XStack ai={'center'} space={'$4'}>
          <StatusIndicator />
          <Stack>
            <Text fos={16} ff={'$body500'} col={'$white'}>
              {title}
            </Text>
            {subtitle && (
              <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
                {subtitle}
              </Text>
            )}
          </Stack>
        </XStack>
        <XStack ai={'center'} space={'$2'}>
          {sideNote && (
            <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
              {sideNote}
            </Text>
          )}
          <Image
            source={chevronRightSvg}
            stroke={getTokens().color.greyOnBlack.val}
          />
        </XStack>
      </XStack>
    </TouchableOpacity>
  )
}

export default ChecklistCell
