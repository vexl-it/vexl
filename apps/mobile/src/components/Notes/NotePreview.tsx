import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Note} from '@vexl-next/ui'
import React from 'react'
import {randomSeedFromNote} from '../../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from '../AnonymousAvatar'
import {useNoteDisplayData} from './useNoteDisplayData'

interface Props {
  readonly note: OneNoteInState
}

export function NotePreview({note}: Props): React.JSX.Element {
  const {tierLabel, commonFriendsText, trustedFriendsText, expiryText} =
    useNoteDisplayData(note)

  return (
    <Note
      variant="preview"
      avatar={
        <AnonymousAvatarOrClubImage
          grayScale={false}
          size="$9"
          seed={randomSeedFromNote(note)}
        />
      }
      name={tierLabel}
      commonFriends={commonFriendsText}
      trustedFriends={trustedFriendsText}
      expiration={expiryText}
      message={note.noteInfo.publicPart.text}
    />
  )
}
