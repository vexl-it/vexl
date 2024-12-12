import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack, type StackProps} from 'tamagui'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../../../utils/unixMillisecondsToLocaleDateTime'
import Button from '../../../../../../Button'
import Image from '../../../../../../Image'
import closeSvg from '../../../../../../images/closeSvg'
import plusSvg from '../../../../../../images/plusSvg'
import {
  addTimeOptionForAvailableDateActionAtom,
  availableDateTimesFromAtom,
  removeTimestampFromAvailableAtom,
} from '../../../atoms'
import TimeFromDropdown from './TimeFromDropdown'
import TimeToOptions from './TimeToOptions'

interface Props extends StackProps {
  date: UnixMilliseconds
}

function TimeOptionsPerDate({date, ...props}: Props): JSX.Element {
  const {t} = useTranslation()
  const availableDateTimesFrom = useAtomValue(availableDateTimesFromAtom)
  const removeTimestampFromAvailable = useSetAtom(
    removeTimestampFromAvailableAtom
  )
  const addTimeOptionForAvailableDate = useSetAtom(
    addTimeOptionForAvailableDateActionAtom
  )

  const timeOptionsPerDate = useMemo(() => {
    const timeOptions: UnixMilliseconds[] = []
    availableDateTimesFrom.forEach((entry) => {
      if (
        DateTime.fromMillis(entry).toFormat('yyyy-MM-dd') ===
        DateTime.fromMillis(date).toFormat('yyyy-MM-dd')
      ) {
        timeOptions.push(entry)
      }
    })
    return timeOptions
  }, [availableDateTimesFrom, date])

  return (
    <Stack
      jc="space-between"
      bbw={2}
      bbc="$backgroundBlack"
      py="$6"
      gap="$4"
      {...props}
    >
      <Text fos={16} ff="$body600">
        {unixMillisecondsToLocaleDateTime(date).toLocaleString(
          DateTime.DATE_MED_WITH_WEEKDAY,
          {
            locale: getCurrentLocale(),
          }
        )}
      </Text>
      {timeOptionsPerDate.map((timeOption) => (
        <Stack
          key={timeOption}
          borderWidth={0.5}
          borderTopColor="$greyAccent1"
          py="$2"
        >
          <Stack als="flex-end">
            <TouchableOpacity
              onPress={() => {
                removeTimestampFromAvailable(timeOption)
              }}
            >
              <Image
                source={closeSvg}
                stroke={getTokens().color.greyOnBlack.val}
              />
            </TouchableOpacity>
          </Stack>
          <XStack width="100%" ai="center" jc="space-between" px="$2" mt="$2">
            {timeOption < DateTime.now().startOf('hour').toMillis() && (
              <Stack
                pos="absolute"
                t={-5}
                b={-5}
                l={0}
                r={0}
                bc="rgba(76, 76, 76, 0.4)"
                zIndex="$100"
                br="$4"
              >
                <XStack ai="center" gap="$1" p="$1">
                  <Image
                    height={12}
                    width={12}
                    source={closeSvg}
                    stroke={getTokens().color.main.val}
                  />
                  <Text fos={12} col="$main">
                    {t('common.outdated')}
                  </Text>
                </XStack>
              </Stack>
            )}
            <XStack f={1} ai="center" jc="space-around">
              <Stack width={120}>
                <TimeFromDropdown availableDateTimeFrom={timeOption} />
              </Stack>
              <Text>{`->`}</Text>
              <Stack>
                <TimeToOptions timeFromTimestamp={timeOption} />
              </Stack>
            </XStack>
          </XStack>
        </Stack>
      ))}
      {date >= DateTime.now().startOf('day').toMillis() && (
        <Button
          size="small"
          variant="blackOnDark"
          onPress={() => {
            addTimeOptionForAvailableDate(date)
          }}
          beforeIcon={plusSvg}
          text={t('common.addMore')}
        />
      )}
    </Stack>
  )
}

export default TimeOptionsPerDate
