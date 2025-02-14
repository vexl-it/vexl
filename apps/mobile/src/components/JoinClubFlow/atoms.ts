import {taskEitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {createScope, molecule} from 'bunshi/dist/react'
import {Effect, pipe} from 'effect'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'

export const CODE_LENGTH = 6

function createAccessCodeDefaultValue(): string[] {
  return Array.from({length: CODE_LENGTH}, (_, index) => '')
}

export const accessCodeDefaultValue: string[] = createAccessCodeDefaultValue()

export const AccessCodeScope = createScope<
  WritableAtom<string[], [SetStateAction<string[]>], void>
>(atom<string[]>(accessCodeDefaultValue))

export const accessCodeMolecule = molecule((_, getScope) => {
  const accessCodeAtom = getScope(AccessCodeScope)

  const accessCodeAtomsAtom = splitAtom(accessCodeAtom)

  const isCodeInvalidAtom = atom(false)
  const isCodeFilledAtom = atom((get) => {
    const accessCodeAtoms = get(accessCodeAtomsAtom)
    return accessCodeAtoms.every((atom) => get(atom) !== '')
  })

  const handleAccessCodeElementChangeActionAtom = atom(
    null,
    (get, set, code: string) => {
      const accessCodeAtoms = get(accessCodeAtomsAtom)
      const splitChars = code.slice(0, code.length).split('')

      for (let i = 0; i < CODE_LENGTH; i++) {
        const accessCodeElementOnIndexAtom = accessCodeAtoms[i]
        const char = splitChars[i]

        if (char && accessCodeElementOnIndexAtom) {
          set(accessCodeElementOnIndexAtom, char)
        } else if (!char && accessCodeElementOnIndexAtom) {
          set(accessCodeElementOnIndexAtom, '')
        }
      }
    }
  )

  const handleCodeSubmitActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)

    return pipe(
      taskEitherToEffect(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              title: t('clubs.wannaStepInsideOfClub'),
              description: t('clubs.joiningClubGivesYouAccess'),
              negativeButtonText: t('common.cancel'),
              positiveButtonText: t('common.continue'),
            },
          ],
        })
      ),
      Effect.match({
        onSuccess: () => {},
        onFailure: () => {},
      }),
      Effect.runFork
    )
  })

  return {
    accessCodeAtom,
    accessCodeAtomsAtom,
    isCodeInvalidAtom,
    isCodeFilledAtom,
    handleAccessCodeElementChangeActionAtom,
    handleCodeSubmitActionAtom,
  }
})
