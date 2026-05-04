import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {type AutoOpenTradeChecklistReveal} from '../../TradeChecklistFlow/domain'
import {chatMolecule} from '../atoms'

interface Options {
  readonly closeModal?: boolean
}

export default function useOpenTradeChecklistReveal(): (
  autoOpenReveal: AutoOpenTradeChecklistReveal,
  options?: Options
) => void {
  const navigation = useNavigation()
  const {chatIdAtom, publicKeyPemBase64Atom, showModalAtom} =
    useMolecule(chatMolecule)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const setModal = useSetAtom(showModalAtom)

  return useCallback(
    (autoOpenReveal: AutoOpenTradeChecklistReveal, options?: Options) => {
      Keyboard.dismiss()
      if (options?.closeModal) setModal(false)

      navigation.navigate('TradeChecklistFlow', {
        screen: 'AgreeOnTradeDetails',
        params: {autoOpenReveal},
        chatId,
        inboxKey,
      })
    },
    [chatId, inboxKey, navigation, setModal]
  )
}
