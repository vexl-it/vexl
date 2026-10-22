import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {NoteMeta, Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {randomSeedFromNote} from '../../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from '../AnonymousAvatar'
import {useNoteDisplayData} from './useNoteDisplayData'

const AVATAR_SIZE = 40

interface Props {
  readonly note: OneNoteInState
  readonly now?: number
}

/**
 * Bare header row for a note (avatar + trust tier / "You" + common and
 * trusted friends counts and expiry). Used where the note is embedded without
 * the card chrome (note detail, send message screen). For the full card use
 * NoteCard / the shared Note component.
 */
export function NoteInfoHeader({note, now}: Props): React.JSX.Element {
  const {tierLabel, commonFriendsText, trustedFriendsText, expiryText} =
    useNoteDisplayData(note, now)

  return (
    <XStack alignItems="center" gap="$3">
      <AnonymousAvatarOrClubImage
        grayScale={false}
        customSize={AVATAR_SIZE}
        seed={randomSeedFromNote(note)}
      />
      <YStack flex={1} gap="$1">
        {tierLabel ? (
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {tierLabel}
          </Typography>
        ) : null}
        <NoteMeta
          commonFriends={commonFriendsText}
          trustedFriends={trustedFriendsText}
          expiration={expiryText}
        />
      </YStack>
    </XStack>
  )
}
