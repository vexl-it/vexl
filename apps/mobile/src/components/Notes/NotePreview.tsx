import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {TEXT_AREA_MIN_HEIGHT, TwoToneCard, Typography} from '@vexl-next/ui'
import React from 'react'
import {NoteInfoHeader} from './NoteInfoHeader'

interface Props {
  readonly note: OneNoteInState
}

export function NotePreview({note}: Props): React.JSX.Element {
  return (
    <TwoToneCard gap="$2">
      <TwoToneCard.Header>
        <NoteInfoHeader note={note} />
      </TwoToneCard.Header>
      <TwoToneCard.Content minHeight={TEXT_AREA_MIN_HEIGHT}>
        <Typography variant="paragraph" color="$foregroundPrimary">
          {note.noteInfo.publicPart.text}
        </Typography>
      </TwoToneCard.Content>
    </TwoToneCard>
  )
}
