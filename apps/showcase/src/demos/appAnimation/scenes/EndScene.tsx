import {Stack, VexlTextGraphic} from '@vexl-next/ui'

/** The closing card: the Vexl logo on brand yellow. */
export function EndScene(): React.JSX.Element {
  return (
    <Stack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$accentYellowPrimary"
    >
      <VexlTextGraphic variant="dark" width={240} height={73} animate />
    </Stack>
  )
}
