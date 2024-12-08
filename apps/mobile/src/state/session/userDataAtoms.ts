import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  type RealLifeInfo,
  type UserNameAndUriAvatar,
} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  phoneNumberToRegionCode,
  type RegionCode,
} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {pipe} from 'effect'
import {atom, type SetStateAction} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {askAreYouSureActionAtom} from '../../components/AreYouSureDialog'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {goldenAvatarTypeAtom} from '../../utils/preferences'
import {sessionDataOrDummyAtom} from './index'
import {generateRandomUserData} from './utils/generateRandomUserData'

export const realUserDataAtom = focusAtom(sessionDataOrDummyAtom, (p) =>
  p.prop('realUserData')
)

export const userPhoneNumberAtom = focusAtom(sessionDataOrDummyAtom, (p) =>
  p.prop('phoneNumber')
)

export const realUserImageAtom = atom(
  (get): UserNameAndUriAvatar['image'] | undefined => {
    return get(realUserDataAtom)?.image
  },
  (
    get,
    set,
    update: SetStateAction<UserNameAndUriAvatar['image'] | undefined>
  ) => {
    const newValue = getValueFromSetStateActionOfAtom(update)(
      () => get(realUserDataAtom)?.image
    )

    set(realUserDataAtom, (old): UserNameAndUriAvatar => {
      return {...old, image: newValue}
    })
  }
)

export const areRealUserDataSet = atom((get) => {
  const {userName, image} = get(realUserDataAtom) ?? {}
  return !!userName && !!image
})

export const realUserNameAtom = atom(
  (get): UserName | undefined => {
    return get(realUserDataAtom)?.userName
  },
  (get, set, update: SetStateAction<UserName | undefined>) => {
    const newValue = getValueFromSetStateActionOfAtom(update)(
      () => get(realUserDataAtom)?.userName
    )

    set(realUserDataAtom, (old): UserNameAndUriAvatar => {
      return {...old, userName: newValue}
    })
  }
)

export const anonymizedUserDataAtom = atom((get) => {
  const goldenAvatarType = get(goldenAvatarTypeAtom)
  const {privateKey} = get(sessionDataOrDummyAtom)
  return generateRandomUserData({
    seed: privateKey?.publicKeyPemBase64,
    goldenAvatarType,
  })
})

export const userDataRealOrAnonymizedAtom = atom<RealLifeInfo>((get) => {
  const real = get(realUserDataAtom)
  const anonymized = get(anonymizedUserDataAtom)

  return {
    userName: real?.userName ?? anonymized.userName,
    image: real?.image ?? anonymized.image,
  }
})

export const invalidUsernameUIFeedbackAtom = atom(null, async (get, set) => {
  const {t} = get(translationAtom)

  return await pipe(
    set(askAreYouSureActionAtom, {
      steps: [
        {
          type: 'StepWithText',
          title: t('editName.invalidUsername'),
          description: t('loginFlow.name.nameValidationError'),
          positiveButtonText: t('common.close'),
        },
      ],
      variant: 'danger',
    })
  )()
})

export const regionCodeAtom = atom<RegionCode | undefined>((get) => {
  return phoneNumberToRegionCode(get(sessionDataOrDummyAtom).phoneNumber)
})
