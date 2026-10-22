import {useMolecule} from 'bunshi/dist/react'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {smallestClubForIdsAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {getOtherSideRole} from '../../../utils/offerTypeSemantics'
import {randomSeedFromChat, randomSeedFromNote} from '../../../utils/RandomSeed'
import {chatMolecule} from '../atoms'

export function useCommonFriendsOtherSide(): NonNullable<
  RootStackScreenProps<'CommonFriends'>['route']['params']['otherSide']
> {
  const {chatAtom, offerForChatAtom, noteForChatAtom, otherSideClubsIdsAtom} =
    useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const note = useAtomValue(noteForChatAtom)
  const clubIds = useAtomValue(otherSideClubsIdsAtom)
  const club = useAtomValue(
    useMemo(() => smallestClubForIdsAtom(clubIds ?? []), [clubIds])
  )

  return useMemo(
    () => ({
      role: getOtherSideRole({
        offer: offer?.offerInfo.publicPart,
        otherSideIsAuthor:
          chat.otherSide.publicKey ===
          offer?.offerInfo.publicPart.offerPublicKey,
      }),
      avatarSeed:
        note && !note.ownershipInfo
          ? randomSeedFromNote(note)
          : randomSeedFromChat(chat),
      clubImageUrl: Option.isSome(club)
        ? club.value.club.clubImageUrl
        : undefined,
    }),
    [chat, offer, note, club]
  )
}
