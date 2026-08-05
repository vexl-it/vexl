import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Array, Schema} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {BlockedChatSender, BlockedChatSendersState} from '../blockedChatSender'

export const {
  atom: blockedChatSendersStorageAtom,
  setAndSaveImmediatelyAtom: setBlockedChatSendersImmediatelyAtom,
} = atomWithParsedMmkvStorageWithImmediateSaveOption(
  'blockedChatSenders',
  {blockedSenders: []},
  BlockedChatSendersState
)

export const blockedChatSendersAtom = atom(
  (get) => get(blockedChatSendersStorageAtom).blockedSenders
)

export const addBlockedChatSenderActionAtom = atom(
  null,
  (
    get,
    set,
    entry: {
      inboxPublicKey: PublicKeyPemBase64
      blockedSenderPublicKey: PublicKeyPemBase64
    }
  ) => {
    const blockedSender = Schema.decodeSync(BlockedChatSender)(entry)
    set(setBlockedChatSendersImmediatelyAtom, (state) => ({
      blockedSenders: Array.dedupeWith(
        [...state.blockedSenders, blockedSender],
        (left, right) =>
          left.inboxPublicKey === right.inboxPublicKey &&
          left.blockedSenderPublicKey === right.blockedSenderPublicKey
      ),
    }))
  }
)
