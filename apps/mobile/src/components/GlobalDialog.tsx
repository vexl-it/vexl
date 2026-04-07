import {createDialogAtom, DialogFromAtom} from '@vexl-next/ui'
import React from 'react'

export const globalDialogAtom = createDialogAtom()

export function GlobalDialog(): React.JSX.Element {
  return <DialogFromAtom dialogAtom={globalDialogAtom} />
}
