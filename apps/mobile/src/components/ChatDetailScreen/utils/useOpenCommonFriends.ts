import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {chatMolecule} from '../atoms'
import {useCommonFriendsOtherSide} from './useCommonFriendsOtherSide'

export function useOpenCommonFriends(): () => void {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    otherSideClubsIdsAtom,
    friendLevelInfoAtom,
    isMyChatOriginAtom,
  } = useMolecule(chatMolecule)
  const otherSide = useCommonFriendsOtherSide()
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])
  const friendLevel = useAtomValue(friendLevelInfoAtom)
  const isMine = useAtomValue(isMyChatOriginAtom)

  return useCallback(() => {
    navigation.navigate('CommonFriends', {
      contactsHashes: commonConnectionsHashes,
      verifiedHashes: verifiedConnectionsHashes,
      clubs: otherSideClubs,
      friendLevel,
      isMine,
      otherSide,
    })
  }, [
    commonConnectionsHashes,
    friendLevel,
    isMine,
    navigation,
    otherSideClubs,
    otherSide,
    verifiedConnectionsHashes,
  ])
}
