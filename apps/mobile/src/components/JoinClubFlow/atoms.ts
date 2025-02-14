import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {eitherToEfect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {createScope, molecule} from 'bunshi/dist/react'
import {Effect, Option, Schema} from 'effect'
import Camera, {type BarcodeScanningResult, type BarcodeType} from 'expo-camera'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../api'
import {storedClubsAtom} from '../../state/contacts/atom/clubsStore'
import {JoinClubFromLinkPayload} from '../../state/contacts/domain'
import {LINK_TYPE_JOIN_CLUB} from '../../utils/deepLinks/domain'
import {
  DataAndTypeElementsDeepLinkError,
  LinkToDeepLink,
} from '../../utils/deepLinks/parseDeepLink'
import {parseJsonFp} from '../../utils/fpUtils'
import {getImageFromGalleryAndTryToResolveThePermissionsAlongTheWay} from '../../utils/imagePickers'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../utils/notifications'
import reportError from '../../utils/reportError'
import showErrorAlert from '../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import clubImagePlaceholderSvg from './images/clubImagePlaceholderSvg'

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

  const handleCodeSubmitActionAtom = atom(null, (get, set) => {
    const {t} = get(translationAtom)
    const api = get(apiAtom)
    const code = Schema.decodeSync(ClubCode)(get(accessCodeAtom).join(''))

    return Effect.gen(function* (_) {
      const newKeypair = yield* _(eitherToEfect(generateKeyPair()))
      const notificationToken = yield* _(
        getNotificationTokenE(),
        Effect.map(Option.fromNullable)
      )

      const club = yield* _(
        api.contact.getClubInfoByAccessCode({
          code,
          keyPair: newKeypair,
        })
      )

      const storedClubs = get(storedClubsAtom)

      // is user already in the club?
      const keyPair = storedClubs[club.club.uuid] ?? newKeypair

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              imageSource: {
                type: club.club.clubImageUrl ? 'imageUri' : 'svgXml',
                imageUri: club.club.clubImageUrl,
                svgXml: clubImagePlaceholderSvg,
              },
              title: t('clubs.wannaStepInsideOfClub', {
                clubName: club.club.name,
              }),
              description: t('clubs.joiningClubGivesYouAccess', {
                clubName: club.club.name,
              }),
              negativeButtonText: t('common.cancel'),
              positiveButtonText: t('common.continue'),
            },
          ],
        })
      )

      const {clubInfoForUser} = yield* _(
        api.contact.joinClub({
          keyPair,
          code,
          contactsImported: true,
          notificationToken,
        })
      )

      set(storedClubsAtom, (prevState) => ({
        ...prevState,
        [clubInfoForUser.club.uuid]: keyPair,
      }))

      yield* _(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              imageSource: {
                type: club.club.clubImageUrl ? 'imageUri' : 'svgXml',
                imageUri: club.club.clubImageUrl,
                svgXml: clubImagePlaceholderSvg,
              },
              title: t('clubs.clubJoinedSuccessfully'),
              description: t('clubs.nowYouWillSeeOffersFromClubMembers'),
              positiveButtonText: t('common.ok'),
            },
          ],
        })
      )

      return true
    }).pipe(
      Effect.catchAll((e) => {
        if (e._tag === 'UserDeclinedError') return Effect.succeed(false)

        if (e._tag === 'NotFoundError') {
          set(isCodeInvalidAtom, true)
          return Effect.succeed(false)
        }

        if (
          e._tag === 'ClubUserLimitExceededError' ||
          e._tag === 'MemberAlreadyInClubError'
        ) {
          return set(askAreYouSureActionAtom, {
            variant: 'danger',
            steps: [
              {
                type: 'StepWithText',
                imageSource: require('../../components/images/block.png'),
                title: t('clubs.joiningUnsucessful'),
                description:
                  e._tag === 'ClubUserLimitExceededError'
                    ? t('clubs.clubIsFullDescription')
                    : t('clubs.youAreAlreadyMemberOfThisClubDescription'),
                positiveButtonText: t('common.close'),
              },
            ],
          }).pipe(Effect.match({onSuccess: () => true, onFailure: () => true}))
        }

        if (
          e._tag === 'UnauthorizedError' ||
          e._tag === 'UnexpectedApiResponseError' ||
          e._tag === 'UnknownClientError' ||
          e._tag === 'UnknownServerError' ||
          e._tag === 'CryptoError'
        ) {
          reportError('error', new Error('Join club error'), {e})
        }

        showErrorAlert({
          title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
          error: e,
        })

        return Effect.succeed(false)
      })
    )
  })

  const handleCodeScannedActionAtom = atom(
    null,
    (get, set, barcodeScanningResult: BarcodeScanningResult) => {
      const {t} = get(translationAtom)
      const {data: scanResult} = barcodeScanningResult

      return Effect.gen(function* (_) {
        const deepLinkData = yield* _(Schema.decode(LinkToDeepLink)(scanResult))

        const {type, data} = deepLinkData

        if (Option.isNone(type) || Option.isNone(data)) {
          return yield* _(
            Effect.fail(
              new DataAndTypeElementsDeepLinkError({
                message: 'Data and type elements are required',
                cause: new Error('Data and type elements are required'),
              })
            )
          )
        }

        if (Option.isSome(type) && type.value !== LINK_TYPE_JOIN_CLUB) {
          return false
        }

        const joinClubLinkData = yield* _(
          eitherToEfect(parseJsonFp(data.value)),
          Effect.flatMap(Schema.decodeUnknown(JoinClubFromLinkPayload))
        )

        set(accessCodeAtom, joinClubLinkData.code.split(''))
        set(handleCodeSubmitActionAtom)

        return true
      }).pipe(
        Effect.catchAll((e) => {
          if (e._tag === 'JsonParseError' || e._tag === 'ParseError') {
            reportError(
              'warn',
              new Error('Error while parsing phone number from QR code'),
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
    handleCodeSubmitActionAtom,
    handleCodeScannedActionAtom,
    getClubQrCodeFromDeviceImageLibraryActionAtom,
  }
})
