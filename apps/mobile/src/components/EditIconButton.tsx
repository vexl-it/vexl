import {IconButton, PencilWriteEdit, tokens} from '@vexl-next/ui'
import React from 'react'
import {useTheme} from 'tamagui'

type Props = Omit<React.ComponentProps<typeof IconButton>, 'children'> & {
  readonly 'aria-label': string
}

export function EditIconButton(props: Props): React.ReactElement {
  const theme = useTheme()

  return (
    <IconButton backgroundColor="$backgroundTertiary" {...props}>
      <PencilWriteEdit
        size={tokens.size[7].val}
        color={theme.foregroundPrimary.get()}
      />
    </IconButton>
  )
}
