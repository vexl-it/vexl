import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {NoteInfoHeader} from './NoteInfoHeader'

interface Props {
  readonly note: OneNoteInState
}

/**
 * Header row + note text rendered on the plain screen background. The top
 * block of the note detail and send message screens.
 */
export function NotePreview({note}: Props): React.JSX.Element {
  return (
    <YStack gap="$4">
      <NoteInfoHeader note={note} />
      <Typography variant="paragraphDemibold" color="$foregroundPrimary">
        {note.noteInfo.publicPart.text}
      </Typography>
    </YStack>
  )
}
