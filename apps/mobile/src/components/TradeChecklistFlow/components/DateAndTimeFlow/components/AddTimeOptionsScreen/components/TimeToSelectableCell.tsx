import {
  UnixMilliseconds,
  UnixMilliseconds0,
  UnixMillisecondsE,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {useAtom} from 'jotai'
import {useMemo} from 'react'
import SelectableCell from '../../../../../../SelectableCell'
import {createIsTimeOptionSelectedAtom} from '../../../atoms'

function TimeToSelectableCell({
  label,
  value,
}: {
  label: string | undefined
  value: UnixMilliseconds | undefined
}): React.ReactElement {
  const timestamp = Schema.decodeSync(UnixMillisecondsE)(
    value ?? UnixMilliseconds0
  )
  const [isSelected, setIsSelected] = useAtom(
    useMemo(() => createIsTimeOptionSelectedAtom(timestamp), [timestamp])
  )

  return (
    <SelectableCell
      key={value}
      selected={isSelected}
      title={label ?? ''}
      size="small"
      type={UnixMilliseconds}
      onPress={() => {
        setIsSelected(timestamp)
      }}
    />
  )
}

export default TimeToSelectableCell
