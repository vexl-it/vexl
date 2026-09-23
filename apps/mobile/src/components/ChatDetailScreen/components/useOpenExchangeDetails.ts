import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {prepareExchangeDetailsDraftActionAtom} from '../../TradeChecklistFlow/atoms/exchangeDetailsAtoms'
import {chatMolecule} from '../atoms'

export default function useOpenExchangeDetails(): () => void {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const store = useStore()
  const {chatIdAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)
  const prepareDraft = useSetAtom(prepareExchangeDetailsDraftActionAtom)

  return useCallback(() => {
    prepareDraft()
    navigation.navigate('TradeChecklistFlow', {
      screen: 'ExchangeDetails',
      chatId: store.get(chatIdAtom),
      inboxKey: store.get(publicKeyPemBase64Atom),
    })
  }, [chatIdAtom, navigation, prepareDraft, publicKeyPemBase64Atom, store])
}
