import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Note, RefreshArrowsRectangle} from '@vexl-next/ui'
import React from 'react'
import {randomSeedFromNote} from '../../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from '../AnonymousAvatar'
import {useNoteDisplayData} from './useNoteDisplayData'

const AVATAR_SIZE = 40

interface Props {
  readonly note: OneNoteInState
  readonly messageNumberOfLines?: number
  readonly onPress?: () => void
}

export function NoteCard({
  note,
  messageNumberOfLines,
  onPress,
}: Props): React.JSX.Element {
  const {tierLabel, commonFriendsText, expiryText, repostLabel} =
    useNoteDisplayData(note)

  return (
    <Note
      avatar={
        <AnonymousAvatarOrClubImage
          grayScale={false}
          customSize={AVATAR_SIZE}
          seed={randomSeedFromNote(note)}
        />
      }
      name={tierLabel}
      commonFriends={commonFriendsText}
      expiration={expiryText}
      message={note.noteInfo.publicPart.text}
      messageNumberOfLines={messageNumberOfLines}
      tag={
        repostLabel
          ? {icon: RefreshArrowsRectangle, label: repostLabel}
          : undefined
      }
      onPress={onPress}
    />
  )
}
