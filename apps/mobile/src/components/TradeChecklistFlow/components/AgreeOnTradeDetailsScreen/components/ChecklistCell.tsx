import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import StatusIndicator from './StatusIndicator'
import Image from '../../../../Image'
import chevronRightSvg from '../../../../../images/chevronRightSvg'
import {type TradeChecklistItemStatus} from '../../../domain'

interface Props extends TouchableOpacityProps {
  itemStatus?: TradeChecklistItemStatus
  title: string
  subtitle?: string
  sideNote?: string
}

function ChecklistCell({
  itemStatus = 'unknown',
  sideNote,
  subtitle,
  title,
  ...props
}: Props): JSX.Element {
  return (
    <TouchableOpacity {...props}>
      <XStack
        ai={'center'}
        jc={'space-between'}
        bc={'$grey'}
        px={'$4'}
        py={'$5'}
        br={'$4'}
      >
        <XStack ai={'center'} space={'$4'}>
          <StatusIndicator itemStatus={itemStatus} />
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
