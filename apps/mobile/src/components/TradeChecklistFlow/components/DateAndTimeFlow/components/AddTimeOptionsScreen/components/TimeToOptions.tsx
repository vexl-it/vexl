import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {Stack, XStack} from 'tamagui'
import unixMillisecondsToLocaleDateTime from '../../../../../../../utils/unixMillisecondsToLocaleDateTime'
import TimeToSelectableCell from './TimeToSelectableCell'

interface Props {
  timeFromTimestamp: UnixMilliseconds
}

interface TimeOption {
  label: string
  value: UnixMilliseconds
}

function TimeToOptions({timeFromTimestamp}: Props): React.ReactElement {
  const timeOptionsTo: TimeOption[] = useMemo(() => {
    const options: TimeOption[] = []
    const localizedTimestamp =
      unixMillisecondsToLocaleDateTime(timeFromTimestamp)

    for (let i = 0; i < 4; i++) {
      const timeOptionMillis = Schema.decodeSync(UnixMilliseconds)(
        localizedTimestamp.plus({minutes: 15 * i}).toMillis()
      )
      const timeOptionString = DateTime.fromMillis(
        timeOptionMillis
      ).toLocaleString(DateTime.TIME_SIMPLE)

      options.push({
        label: timeOptionString,
        value: timeOptionMillis,
      })
    }

    return options
  }, [timeFromTimestamp])

  return (
    <Stack gap="$2">
      <XStack gap="$2">
        <TimeToSelectableCell
          label={timeOptionsTo[0]?.label}
          value={timeOptionsTo[0]?.value}
        />
        <TimeToSelectableCell
          label={timeOptionsTo[1]?.label}
          value={timeOptionsTo[1]?.value}
        />
      </XStack>
      <XStack gap="$2">
        <TimeToSelectableCell
          label={timeOptionsTo[2]?.label}
          value={timeOptionsTo[2]?.value}
        />
        <TimeToSelectableCell
          label={timeOptionsTo[3]?.label}
          value={timeOptionsTo[3]?.value}
        />
      </XStack>
    </Stack>
  )
}

export default TimeToOptions
