import {mergeToBoolean} from '@vexl-next/generic-utils/src/effect-helpers/mergeToBoolean'
import {Array, Effect, Schema} from 'effect'
import * as Linking from 'expo-linking'
import {atom, useSetAtom, useStore} from 'jotai'
import {useCallback, useEffect} from 'react'
import {Alert} from 'react-native'
import {showErrorAlert} from '../../components/ErrorAlert'
import {admitUserToClubActionAtom} from '../../state/clubs/atom/admitUserToClubActionAtom'
import {submitCodeToJoinClubActionAtom} from '../../state/clubs/atom/submitCodeToJoinClubActionAtom'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {translationAtom} from '../localization/I18nProvider'
import {isPassedImportContactsOutsideReact} from '../navigation'
import {goldenAvatarTypeAtom} from '../preferences'
import {reportErrorE} from '../reportError'
import {handleGoldenGlassesDeepLinkActionAtom} from './goldenGlassesUrl'
import {handleImportContactFromDeepLinkActionAtom} from './importContactFromDeeplinkWithUiFeedbackActionAtom'
import {
  type DeepLinkData,
  type DeepLinkMeantForNewerVersionError,
  InvalidDeepLinkError,
  parseDeepLink,
} from './parseDeepLink'

export const lastInitialLinkStorageAtom = atomWithParsedMmkvStorage(
  'lastInitialLink',
  {lastLinkImported: null},
  Schema.Struct({lastLinkImported: Schema.NullOr(Schema.String)})
)

export const lastUniversalOrAppLinkStorageAtom = atomWithParsedMmkvStorage(
  'lastUniversalOrAppLink',
  {lastUniversalOrAppLinkImported: null},
  Schema.Struct({lastUniversalOrAppLinkImported: Schema.NullOr(Schema.String)})
)

export class InvalidDeepLinkTypeError extends Schema.TaggedError<InvalidDeepLinkTypeError>(
  'InvalidDeepLinkTypeError'
)('InvalidDeepLinkTypeError', {
  receivedType: Schema.String,
}) {}

export const handleDeepLinkActionAtom = atom(
  null,
  (
    get,
    set,
    url: string,
    acceptOnlySpecificTypes?: Array<DeepLinkData['searchParams']['type']>
  ): Effect.Effect<
    boolean,
    InvalidDeepLinkError | DeepLinkMeantForNewerVersionError
  > =>
    Effect.gen(function* (_) {
      const {searchParams: linkData} = yield* _(parseDeepLink(url))

      if (
        acceptOnlySpecificTypes &&
        !Array.contains(acceptOnlySpecificTypes, linkData.type)
      )
        return yield* _(
          new InvalidDeepLinkError({
            cause: new Error('Invalid link type'),
            originalLink: url,
          })
        )

      if (linkData.type === 'golden-glasses') {
        if (get(goldenAvatarTypeAtom)) return true
        return yield* _(
          set(handleGoldenGlassesDeepLinkActionAtom),
          mergeToBoolean
        )
      } else if (linkData.type === 'import-contact') {
        return yield* _(
          set(handleImportContactFromDeepLinkActionAtom, linkData.data),
          mergeToBoolean
        )
      } else if (linkData.type === 'import-contact-v2') {
        return yield* _(
          set(handleImportContactFromDeepLinkActionAtom, linkData),
          mergeToBoolean
        )
      } else if (linkData.type === 'join-club') {
        return yield* _(
          set(submitCodeToJoinClubActionAtom, linkData.code),
          mergeToBoolean
        )
      } else if (linkData.type === 'request-club-admition') {
        yield* _(set(admitUserToClubActionAtom, linkData), mergeToBoolean)
        return true
      }

      return yield* _(
        new InvalidDeepLinkError({
          cause: new Error('Invalid link type'),
          originalLink: url,
        })
      )
    }).pipe(
      Effect.tapError((e) => {
        const {t} = get(translationAtom)
        if (e._tag === 'DeepLinkMeantForNewerVersionError')
          return Effect.sync(() => {
            Alert.alert(t('linking.linkNotSupportedPleaseUpdate'))
          })

        // do not report exp+vexl:// links that open the app in DEV mode
        if (__DEV__) return Effect.void
        showErrorAlert({
          title: t('linking.wrongLinkFormatReceived', {link: url}),
          error: e,
        })
        return reportErrorE('warn', new Error('Unknown deep link format'), {
          url,
        })
      })
    )
)

export function useHandleUniversalAndAppLinks(): void {
  const store = useStore()
  const handleDeepLink = useSetAtom(handleDeepLinkActionAtom)

  const onLinkReceived = useCallback(
    (link: string) => {
      if (!isPassedImportContactsOutsideReact()) return
      Effect.runFork(handleDeepLink(link))
    },
    [handleDeepLink]
  )

  useEffect(() => {
    // Process initial link
    void Linking.getInitialURL().then((initialLink) => {
      if (!initialLink) return
      if (
        store.get(lastUniversalOrAppLinkStorageAtom)
          .lastUniversalOrAppLinkImported === initialLink
      ) {
        console.info('Ignoring initial link as it was opened before')
        return
      }

      Effect.runFork(
        handleDeepLink(initialLink).pipe(
          Effect.andThen(() => {
            store.set(lastUniversalOrAppLinkStorageAtom, {
              lastUniversalOrAppLinkImported: initialLink,
            })
          })
        )
      )
    })

    // Process incoming links
    const linkOpenSubscription = Linking.addEventListener(
      'url',
      ({url: link}) => {
        if (!isPassedImportContactsOutsideReact()) return
        Effect.runFork(handleDeepLink(link))
      }
    )
    return () => {
      linkOpenSubscription.remove()
    }
  }, [handleDeepLink, onLinkReceived, store])
}
