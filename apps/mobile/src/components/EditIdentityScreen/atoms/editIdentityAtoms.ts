import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Option, Schema} from 'effect/index'
import {atom} from 'jotai'
import {
  invalidUsernameUIFeedbackAtom,
  realUserImageAtom,
  realUserNameAtom,
} from '../../../state/session/userDataAtoms'

export const editProfileIdentityImageUriAtom = atom<UriString | undefined>(
  undefined
)
export const editProfileIdentityNicknameAtom = atom<string>('')

export const prepareEditProfileIdentityDraftActionAtom = atom(
  null,
  (get, set) => {
    const realUserImage = get(realUserImageAtom)

    set(
      editProfileIdentityImageUriAtom,
      realUserImage?.type === 'imageUri' ? realUserImage.imageUri : undefined
    )
    set(editProfileIdentityNicknameAtom, get(realUserNameAtom) ?? '')
  }
)

export const saveEditProfileIdentityDraftActionAtom = atom(null, (get, set) => {
  const parsedUserName = Schema.decodeUnknownOption(UserName)(
    get(editProfileIdentityNicknameAtom).trim()
  )

  if (Option.isNone(parsedUserName)) {
    void set(invalidUsernameUIFeedbackAtom)
    return false
  }

  const imageUri = get(editProfileIdentityImageUriAtom)

  set(realUserNameAtom, parsedUserName.value)
  set(
    realUserImageAtom,
    imageUri
      ? {
          type: 'imageUri',
          imageUri,
        }
      : undefined
  )

  return true
})
