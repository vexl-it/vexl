import {KeyboardAvoidingView} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useAppState} from '../../../utils/useAppState'
import Screen from '../../Screen'
import {chatMolecule} from '../atoms'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import MessagesScreen from './MessagesScreen'

export default function MessagesListOrApprovalPreview(): React.ReactElement {
  const {chatUiModeAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)
  const chatUiMode = useAtomValue(chatUiModeAtom)
  const fetchAndStoreMessagesForInbox = useSetAtom(
    fetchAndStoreMessagesForInboxHandleNotificationsActionAtom
  )
  const publicKeyPemBase64 = useAtomValue(publicKeyPemBase64Atom)

  useAppState(
    useCallback(() => {
      fetchAndStoreMessagesForInbox({
        key: publicKeyPemBase64,
      }).pipe(Effect.runFork)
    }, [fetchAndStoreMessagesForInbox, publicKeyPemBase64])
  )

  // const toRender =
  //   chatUiMode === 'approval' ? (
  //     <RequestScreen />
  //   ) : (
  //     <KeyboardAvoidingView>
  //       <MessagesScreen />
  //     </KeyboardAvoidingView>
  //   )

  return (
    <>
      <MarkAsReadWhenRendered />
      <Screen
        insetsColor="$backgroundSecondary"
        backgroundColor="$backgroundPrimary"
      >
        <KeyboardAvoidingView>
          <MessagesScreen />
        </KeyboardAvoidingView>
      </Screen>
    </>
  )
}
