import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Array} from 'effect'
import {useAtomValue} from 'jotai'
import {importedContactsHashesAtom} from '../../state/contacts/atom/contactsStore'
import {
  applyTrustedFriendsFeatureFlag,
  deriveVisibleCommonFriendsForNote,
} from '../../state/marketplace/utils/visibleCommonFriends'
import {noteExpiryText} from '../../state/notes/utils/noteExpiryText'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import {trustedFriendsCountText} from '../../utils/trustedFriendsText'

export interface NoteDisplayData {
  readonly tierLabel: string | undefined
  readonly commonFriendsText: string | undefined
  readonly trustedFriendsText: string | undefined
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

  const importedContactsHashes = useAtomValue(importedContactsHashesAtom)
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)

  const isMine = !!note.ownershipInfo?.adminId
  const {friendLevel, viaRepost} = note.noteInfo.privatePart
  const visibleCommonFriends = applyTrustedFriendsFeatureFlag(
    deriveVisibleCommonFriendsForNote({
      noteInfo: note.noteInfo,
      importedContactsHashes,
    }),
    showVerifiedContacts
  )

  const tierLabel = isMine
    ? t('notes.detail.you')
    : viaRepost
      ? undefined
      : Array.contains(friendLevel, 'FIRST_DEGREE')
        ? t('notes.card.directFriend')
        : Array.contains(friendLevel, 'SECOND_DEGREE')
          ? t('notes.card.friendOfFriend')
          : undefined

  const commonFriendsText = !isMine
    ? t('notes.card.commonFriendsCount', {
        count: visibleCommonFriends.commonFriends.length,
      })
    : undefined

  const repostLabel = note.repostInfo
    ? t('notes.card.youReposted')
    : viaRepost
      ? t('notes.card.reposted')
      : undefined

  return {
    tierLabel,
    commonFriendsText,
    trustedFriendsText: !isMine
      ? trustedFriendsCountText(
          visibleCommonFriends.verifiedCommonFriends.length,
          t
        )
      : undefined,
    expiryText: noteExpiryText(note.noteInfo.expiresAt, now ?? Date.now(), t),
    repostLabel,
  }
}
