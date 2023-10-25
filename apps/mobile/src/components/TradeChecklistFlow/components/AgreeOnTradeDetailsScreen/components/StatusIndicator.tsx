import {Stack} from 'tamagui'

function StatusIndicator(): JSX.Element {
  return (
    <Stack
      w={24}
      h={24}
      borderWidth={1}
      boc={'$greyAccent3'}
      br={'$2'}
      bc={'transparent'}
    ></Stack>
  )
}

export default StatusIndicator
