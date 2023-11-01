import {getTokens, Stack, type StackProps, Text, XStack} from 'tamagui'
import {DateTime} from 'luxon'
import {i18n} from '../../../../../../../utils/localization/I18nProvider'
import {TouchableOpacity} from 'react-native'
import Image from '../../../../../../Image'
import closeSvg from '../../../../../../images/closeSvg'
import {useSetAtom} from 'jotai'
import {removeTimestampFromAvailableAtom} from '../../../atoms'
import TimeFromDropdown from './TimeFromDropdown'
import {type AvailableDateTimeOption} from '../../../../../domain'
import TimeToDropdown from './TimeToDropdown'

interface Props extends StackProps {
  availableDateTime: AvailableDateTimeOption
}

function TimeOptionCell({availableDateTime, ...props}: Props): JSX.Element {
  const removeTimestampFromAvailable = useSetAtom(
    removeTimestampFromAvailableAtom
  )

  return (
    <Stack
      ai={'flex-start'}
      jc={'space-between'}
      bbw={2}
      bbc={'$backgroundBlack'}
      py={'$6'}
      {...props}
    >
      <Text fos={16} ff={'$body600'}>
        {DateTime.fromMillis(availableDateTime.date).toLocaleString(
          DateTime.DATE_MED_WITH_WEEKDAY,
          {locale: i18n.locale}
        )}
      </Text>
      <XStack
        width={'100%'}
        ai={'center'}
        jc={'space-between'}
        px={'$2'}
        mt={'$2'}
      >
        <XStack f={1} ai={'center'} jc={'space-around'}>
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
        <XStack ai={'center'}>
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
