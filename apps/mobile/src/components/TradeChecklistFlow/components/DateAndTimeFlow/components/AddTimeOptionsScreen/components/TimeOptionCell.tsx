import {useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens, type StackProps} from 'tamagui'
import {getCurrentLocale} from '../../../../../../../utils/localization/I18nProvider'
import Image from '../../../../../../Image'
import closeSvg from '../../../../../../images/closeSvg'
import {removeTimestampFromAvailableAtom} from '../../../atoms'
import TimeFromDropdown from './TimeFromDropdown'
import TimeToDropdown from './TimeToDropdown'
import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'

interface Props extends StackProps {
  availableDateTime: AvailableDateTimeOption
}

function TimeOptionCell({availableDateTime, ...props}: Props): JSX.Element {
  const removeTimestampFromAvailable = useSetAtom(
    removeTimestampFromAvailableAtom
  )

  return (
    <Stack
      ai="flex-start"
      jc="space-between"
      bbw={2}
      bbc="$backgroundBlack"
      py="$6"
      {...props}
    >
      <Text fos={16} ff="$body600">
        {DateTime.fromMillis(availableDateTime.date).toLocaleString(
          DateTime.DATE_MED_WITH_WEEKDAY,
          {locale: getCurrentLocale()}
        )}
      </Text>
      <XStack
        width="100%"
        ai="center"
        jc="space-between"
        px="$2"
        mt="$2"
      >
        <XStack f={1} ai="center" jc="space-around">
          <Stack width={150}>
            <TimeFromDropdown availableDateTimeFrom={availableDateTime.from} />
          </Stack>
          <Text>-</Text>
          <Stack width={150}>
            <TimeToDropdown
              availableDateTimeFrom={availableDateTime.from}
              availableDateTimeTo={availableDateTime.to}
            />
          </Stack>
        </XStack>
        <XStack ai="center">
          <TouchableOpacity
            onPress={() => {
              removeTimestampFromAvailable(availableDateTime.date)
            }}
          >
            <Image
              source={closeSvg}
              stroke={getTokens().color.greyOnBlack.val}
            />
          </TouchableOpacity>
        </XStack>
      </XStack>
    </Stack>
  )
}

export default TimeOptionCell
