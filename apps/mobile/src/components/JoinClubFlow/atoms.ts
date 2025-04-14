import {createScope, molecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import Camera, {type BarcodeScanningResult, type BarcodeType} from 'expo-camera'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'

import {handleDeepLinkActionAtom} from '../../utils/deepLinks'
import {getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay} from '../../utils/imagePickers'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import showErrorAlert from '../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'

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

      if (get(isCodeInvalidAtom)) {
        set(isCodeInvalidAtom, false)
      }

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

  const handleCodeScannedActionAtom = atom(
    null,
    (get, set, barcodeScanningResult: BarcodeScanningResult) => {
      const {t} = get(translationAtom)
      return Effect.gen(function* (_) {
        const {data: scanResult} = barcodeScanningResult

        return yield* _(set(handleDeepLinkActionAtom, scanResult))
      }).pipe(
        Effect.catchAll((e) => {
          if (e._tag === 'InvalidDeepLinkError') {
            reportError(
              'warn',
              new Error('Error while parsing join club qr code'),
              {
                e,
              }
            )
            showErrorAlert({
              title: t('common.errorWhileReadingQrCode'),
              error: e,
            })

            return Effect.succeed(false)
          }

          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })

          return Effect.succeed(false)
        })
      )
    }
  )

  const getClubQrCodeFromDeviceImageLibraryActionAtom = atom(
    null,
    (get, set) => {
      const {t} = get(translationAtom)

      return Effect.gen(function* (_) {
        const image = yield* _(
          getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay({
            aspect: [1, 1],
          })
        )

        const barcodeScanningResult = yield* _(
          Effect.tryPromise(
            async () => await Camera.scanFromURLAsync(image.uri)
          )
        )

        const qrCodeScanningResult = barcodeScanningResult.find(
          (result) => (result.type as BarcodeType) === 'qr'
        )

        if (qrCodeScanningResult)
          return set(handleCodeScannedActionAtom, qrCodeScanningResult)

        return false
      }).pipe(
        Effect.catchAll((e) => {
          if (
            e._tag === 'UnknownException' ||
            (e._tag === 'ImagePickerError' && e.reason !== 'NothingSelected')
          )
            showErrorAlert({
              title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
              error: e,
            })

          return Effect.succeed(false)
        })
      )
    }
  )

  return {
    accessCodeAtom,
    accessCodeAtomsAtom,
    isCodeInvalidAtom,
    isCodeFilledAtom,
    handleAccessCodeElementChangeActionAtom,
    handleCodeScannedActionAtom,
    getClubQrCodeFromDeviceImageLibraryActionAtom,
  }
})
