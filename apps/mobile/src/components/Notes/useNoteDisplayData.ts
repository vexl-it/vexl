import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Array} from 'effect'
import {noteExpiryText} from '../../state/notes/utils/noteExpiryText'
import {useTranslation} from '../../utils/localization/I18nProvider'

export interface NoteDisplayData {
  readonly tierLabel: string | undefined
  readonly commonFriendsText: string | undefined
  readonly expiryText: string
  readonly repostLabel: string | undefined
}

/**
 * Derives the display strings for a note (trust tier / "You", common friends
 * count, expiry countdown, repost tag). Shared by the board card, the note
 * detail / send message headers and the chat-from-note preview.
 */
export function useNoteDisplayData(
  note: OneNoteInState,
  now?: number
): NoteDisplayData {
  const {t} = useTranslation()

  const isMine = !!note.ownershipInfo?.adminId
  const {friendLevel, viaRepost, commonFriends} = note.noteInfo.privatePart

  const tierLabel = isMine
    ? t('notes.detail.you')
    : viaRepost
      ? undefined
      : Array.contains(friendLevel, 'FIRST_DEGREE')
        ? t('notes.card.directFriend')
        : Array.contains(friendLevel, 'SECOND_DEGREE')
          ? t('notes.card.friendOfFriend')
          : undefined

  const commonFriendsText =
    !isMine && commonFriends.length > 0
      ? t('notes.card.commonFriendsCount', {count: commonFriends.length})
      : undefined

  const repostLabel = note.repostInfo
    ? t('notes.card.youReposted')
    : viaRepost
      ? t('notes.card.reposted')
      : undefined

  return {
    tierLabel,
    commonFriendsText,
    expiryText: noteExpiryText(note.noteInfo.expiresAt, now ?? Date.now(), t),
    repostLabel,
  }
}
