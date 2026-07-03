import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {
  PeopleUsers,
  SandWatch,
  Typography,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import React from 'react'
import {getTokens} from 'tamagui'
import {randomSeedFromNote} from '../../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from '../AnonymousAvatar'
import {useNoteDisplayData} from './useNoteDisplayData'

const AVATAR_SIZE = 40

interface Props {
  readonly note: OneNoteInState
  readonly now?: number
}

/**
 * Bare header row for a note (avatar + trust tier / "You" + common friends
 * count on the left, expiry on the right). Used where the note is embedded
 * without the card chrome (note detail, send message screen). For the full
 * card use NoteCard / the shared Note component.
 */
export function NoteInfoHeader({note, now}: Props): React.JSX.Element {
  const theme = useTheme()
  const {tierLabel, commonFriendsText, expiryText} = useNoteDisplayData(
    note,
    now
  )

  const iconSize = getTokens().size.$5.val

  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <XStack alignItems="center" gap="$3" flex={1}>
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
          {commonFriendsText ? (
            <XStack alignItems="center" gap="$1">
              <PeopleUsers
                color={theme.foregroundSecondary.get()}
                size={iconSize}
              />
              <Typography variant="micro" color="$foregroundSecondary">
                {commonFriendsText}
              </Typography>
            </XStack>
          ) : null}
        </YStack>
      </XStack>
      <XStack alignItems="center" gap="$1" flexShrink={0}>
        <SandWatch color={theme.foregroundSecondary.get()} size={iconSize} />
        <Typography variant="micro" color="$foregroundSecondary">
          {expiryText}
        </Typography>
      </XStack>
    </XStack>
  )
}
