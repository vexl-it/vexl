import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type FriendCheckChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, pipe} from 'effect'
import {atom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {withLoadingOverlayAtom} from '../../../components/LoadingOverlayProvider'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {
  friendChecksFromChat,
  generateFriendCheckPhraseSeed,
  otherSideSupportsFriendCheck,
  type FriendCheck,
} from '../../tradeChecklist/utils/friendCheck'
import {type ChatWithMessages, type FriendCheckLocalState} from '../domain'
import isNoteChatOrigin from '../utils/isNoteChatOrigin'
import {createCanSendMessagesAtom} from './createCanSendMessagesAtom'
import createSubmitChecklistUpdateActionAtom from './sendTradeChecklistUpdateActionAtom'

export function createFriendCheckAtoms({
  chatWithMessagesAtom,
  commonConnectionsHashesAtom,
}: {
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
  commonConnectionsHashesAtom: Atom<readonly HashedPhoneNumber[]>
}): {
  friendCheckAvailableAtom: Atom<boolean>
  friendChecksAtom: Atom<FriendCheck[]>
  startFriendCheckActionAtom: ActionAtomType<
    [HashedPhoneNumber],
    Effect.Effect<boolean>
  >
  confirmFriendVouchedActionAtom: ActionAtomType<
    [HashedPhoneNumber],
    Effect.Effect<boolean>
  >
  updateFriendCheckLocalStateActionAtom: ActionAtomType<
    [{friend: HashedPhoneNumber; update: FriendCheckLocalState}],
    void
  >
} {
  const messagesAtom = selectAtom(chatWithMessagesAtom, (o) => o.messages)
  const localStatesAtom = selectAtom(
    chatWithMessagesAtom,
    (o) => o.friendChecks
  )
  // Notes have no trade checklist to carry the check
  const supportedInChatAtom = selectAtom(
    chatWithMessagesAtom,
    (o) =>
      otherSideSupportsFriendCheck(o.chat) && !isNoteChatOrigin(o.chat.origin)
  )
  const canSendMessagesAtom = createCanSendMessagesAtom(messagesAtom)

  const friendCheckAvailableAtom = atom(
    (get) =>
      get(supportedInChatAtom) &&
      get(canSendMessagesAtom) &&
      Array.isNonEmptyReadonlyArray(get(commonConnectionsHashesAtom))
  )

  // A check about someone who is not a common friend of mine would tell the
  // other person whether that number is in my contacts, so it is ignored.
  const friendChecksAtom = atom((get) => {
    const commonFriends = new Set(get(commonConnectionsHashesAtom))
    return pipe(
      friendChecksFromChat({
        messages: get(messagesAtom),
        friendChecks: get(localStatesAtom),
      }),
      Array.filter((check) => commonFriends.has(check.friend))
    )
  })

  const submitChecklistUpdateAtom =
    createSubmitChecklistUpdateActionAtom(chatWithMessagesAtom)

  const sendFriendCheckActionAtom = atom(
    null,
    (get, set, friendCheck: Omit<FriendCheckChatMessage, 'timestamp'>) =>
      set(submitChecklistUpdateAtom, {
        friendCheck: {...friendCheck, timestamp: unixMillisecondsNow()},
      }).pipe(
        set(withLoadingOverlayAtom),
        Effect.as(true),
        Effect.catchAll((e) => {
          const {t} = get(translationAtom)
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(e, t) ??
              t('common.somethingWentWrongDescription'),
            error: e,
          })
          return Effect.succeed(false)
        })
      )
  )

  const startFriendCheckActionAtom = atom(
    null,
    (_get, set, friend: HashedPhoneNumber) =>
      set(sendFriendCheckActionAtom, {
        friend,
        status: 'REQUEST',
        phraseSeed: generateFriendCheckPhraseSeed(),
      })
  )

  const confirmFriendVouchedActionAtom = atom(
    null,
    (_get, set, friend: HashedPhoneNumber) =>
      set(sendFriendCheckActionAtom, {friend, status: 'VOUCHED'})
  )

  const updateFriendCheckLocalStateActionAtom = atom(
    null,
    (
      _get,
      set,
      {
        friend,
        update,
      }: {friend: HashedPhoneNumber; update: FriendCheckLocalState}
    ) => {
      set(chatWithMessagesAtom, (chat) => ({
        ...chat,
        friendChecks: {
          ...chat.friendChecks,
          [friend]: {...chat.friendChecks?.[friend], ...update},
        },
      }))
    }
  )

  return {
    friendCheckAvailableAtom,
    friendChecksAtom,
    startFriendCheckActionAtom,
    confirmFriendVouchedActionAtom,
    updateFriendCheckLocalStateActionAtom,
  }
}
