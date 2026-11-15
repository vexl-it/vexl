import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useStore} from 'jotai'
import {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {chatMolecule} from '../atoms'

export default function useOpenFriendCheck(): () => void {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const store = useStore()
  const {chatIdAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)

  return useCallback(() => {
    navigation.navigate('TradeChecklistFlow', {
      screen: 'FriendCheck',
      chatId: store.get(chatIdAtom),
      inboxKey: store.get(publicKeyPemBase64Atom),
    })
  }, [chatIdAtom, navigation, publicKeyPemBase64Atom, store])
}
