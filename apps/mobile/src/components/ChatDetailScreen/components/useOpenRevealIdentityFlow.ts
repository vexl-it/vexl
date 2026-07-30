import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {
  prepareRevealIdentityDraftActionAtom,
  shouldOpenRevealIdentitySummaryAtom,
} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import {chatMolecule} from '../atoms'

export default function useOpenRevealIdentityFlow(): () => void {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const store = useStore()
  const {chatIdAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)
  const prepareRevealIdentityDraft = useSetAtom(
    prepareRevealIdentityDraftActionAtom
  )

  return useCallback(() => {
    prepareRevealIdentityDraft()
    navigation.navigate('TradeChecklistFlow', {
      screen: store.get(shouldOpenRevealIdentitySummaryAtom)
        ? 'RevealIdentitySummary'
        : 'RevealIdentityPhoto',
      chatId: store.get(chatIdAtom),
      inboxKey: store.get(publicKeyPemBase64Atom),
    })
  }, [
    chatIdAtom,
    navigation,
    prepareRevealIdentityDraft,
    publicKeyPemBase64Atom,
    store,
  ])
}
