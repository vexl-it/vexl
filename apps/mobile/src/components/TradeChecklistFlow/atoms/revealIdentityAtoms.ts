import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import {
  anonymizedUserDataAtom,
  sessionDataOrDummyAtom,
} from '../../../state/session'
import {tradeChecklistDataAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {revealIdentityDialogUIAtom} from '../../RevealIdentityDialog/atoms'
import {revealIdentityActionAtom} from './updatesToBeSentAtom'

const revealIdentityUsernameAtom = atom<string>('')
const usernameSavedForFutureUseAtom = atom<boolean>(false)
const revealIdentityImageUriAtom = atom<UriString | undefined>(undefined)
const imageSavedForFutureUseAtom = atom<boolean>(false)

export const revealIdentityWithUiFeedbackAtom = atom(null, async (get, set) => {
  const {phoneNumber} = get(sessionDataOrDummyAtom)
  const anonymizedUserData = get(anonymizedUserDataAtom)
  const anonymizedPhoneNumber = anonymizePhoneNumber(phoneNumber)
  const tradeChecklistData = get(tradeChecklistDataAtom)
  const type =
    !tradeChecklistData.identity.sent && tradeChecklistData.identity.received
      ? 'RESPOND_REVEAL'
      : 'REQUEST_REVEAL'

  return await pipe(
    set(revealIdentityDialogUIAtom, {
      type,
      revealIdentityUsernameAtom,
      usernameSavedForFutureUseAtom,
      revealIdentityImageUriAtom,
      imageSavedForFutureUseAtom,
    }),
    TE.map(({type, username, imageUri}) => {
      const identityData = {
        status: type,
        deanonymizedUser: {
          name: username ?? anonymizedUserData.userName,
          partialPhoneNumber: anonymizedPhoneNumber,
        },
        image: imageUri,
      } satisfies IdentityReveal

      set(revealIdentityActionAtom, identityData)
    })
  )()
})
