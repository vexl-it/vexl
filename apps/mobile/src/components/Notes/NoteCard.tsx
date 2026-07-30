import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {Note, RefreshArrowsRectangle} from '@vexl-next/ui'
import React from 'react'
import {randomSeedFromNote} from '../../utils/RandomSeed'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {AnonymousAvatarOrClubImage} from '../AnonymousAvatar'
import {useNoteChatNavigation} from './useNoteChatNavigation'
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
  const {t} = useTranslation()
  const {tierLabel, commonFriendsText, expiryText, repostLabel} =
    useNoteDisplayData(note)
  const {isChatOpen, navigateToChat} = useNoteChatNavigation(
    note.noteInfo.noteId
  )

  return (
    <Note
      avatar={
        <AnonymousAvatarOrClubImage
          grayScale={isChatOpen}
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
      actionButton={
        isChatOpen
          ? {label: t('offer.goToChat'), onPress: navigateToChat}
          : undefined
      }
    />
  )
}
