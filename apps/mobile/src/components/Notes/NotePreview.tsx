import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {
  TwoToneContentFrame,
  TwoToneHeaderFrame,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {NoteInfoHeader} from './NoteInfoHeader'

interface Props {
  readonly note: OneNoteInState
}

export function NotePreview({note}: Props): React.JSX.Element {
  return (
    <YStack gap="$2">
      <TwoToneHeaderFrame>
        <NoteInfoHeader note={note} />
      </TwoToneHeaderFrame>
      <TwoToneContentFrame minHeight={140}>
        <Typography variant="paragraph" color="$foregroundPrimary">
          {note.noteInfo.publicPart.text}
        </Typography>
      </TwoToneContentFrame>
    </YStack>
  )
}
