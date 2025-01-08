import dynamicLinks, {
  type FirebaseDynamicLinksTypes,
} from '@react-native-firebase/dynamic-links'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  SemverStringE,
  compare as compareSemver,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {Effect, type ParseResult, Schema} from 'effect'
import * as Linking from 'expo-linking'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, useStore} from 'jotai'
import {useCallback, useEffect} from 'react'
import {Alert} from 'react-native'
import parse from 'url-parse'
import {z} from 'zod'
import {addContactWithUiFeedbackAtom} from '../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {hashPhoneNumber} from '../../state/contacts/utils'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {version as appVersion} from '../environment'
import {parseJsonFp, safeParse} from '../fpUtils'
import {translationAtom, useTranslation} from '../localization/I18nProvider'
import {navigationRef} from '../navigation'
import {goldenAvatarTypeAtom} from '../preferences'
import reportError from '../reportError'
import showErrorAlert from '../showErrorAlert'
import {
  LINK_TYPE_ENCRYPTED_URL,
  LINK_TYPE_GOLDEN_GLASSES,
  LINK_TYPE_IMPORT_CONTACT,
} from './domain'
import {processEncryptedUrlActionAtom} from './encryptedUrl'
import {handleGoldenGlassesDeepLinkActionAtom} from './goldenGlassesUrl'

type DynamicLink = FirebaseDynamicLinksTypes.DynamicLink

export const handleImportDeepContactActionAtom = atom(
  null,
  (get, set, contactJsonString: string) => {
    const {t} = get(translationAtom)
    return pipe(
      parseJsonFp(contactJsonString),
      TE.fromEither,
      TE.chainEitherKW(safeParse(ImportContactFromLinkPayload)),
      TE.bindTo('payload'),
      TE.bindW('parsedNumber', ({payload}) =>
        pipe(payload.numberToDisplay, safeParse(E164PhoneNumber), TE.fromEither)
      ),
      TE.bindW('numberHash', ({parsedNumber}) =>
        pipe(parsedNumber, hashPhoneNumber, TE.fromEither)
      ),
      TE.match(
        (e) => {
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
          return false
        },
        ({payload, numberHash, parsedNumber}) => {
          void set(addContactWithUiFeedbackAtom, {
            info: {
              name: payload.name,
              label: payload.label,
              numberToDisplay: payload.numberToDisplay,
              rawNumber: payload.numberToDisplay,
            },
            computedValues: {
              normalizedNumber: parsedNumber,
              hash: numberHash,
            },
          })
          return true
        }
      )
    )
  }
)

export const lastInitialLinkStorageAtom = atomWithParsedMmkvStorage(
  'lastInitialLink',
  {lastLinkImported: null},
  z.object({lastLinkImported: z.string().nullable()}).readonly()
)

export function useHandleDeepLink(): void {
  const {t} = useTranslation()
  const store = useStore()

  const onLinkReceived = useCallback(
    (link: DynamicLink) => {
      const url = link.url
      const parsedUrl = parse(url, true)

      switch (parsedUrl.query.type) {
        case LINK_TYPE_IMPORT_CONTACT:
          if (parsedUrl.query.data) {
            void store.set(
              handleImportDeepContactActionAtom,
              parsedUrl.query.data
            )()
          }
          break
        case LINK_TYPE_ENCRYPTED_URL:
          if (parsedUrl.query.data) {
            void store.set(
              processEncryptedUrlActionAtom,
              parsedUrl.query.data
            )()
          }
          break
        default:
          reportError('warn', new Error('Unknown deep link type'), {url})
      }
    },
    [store]
  )

  useEffect(() => {
    dynamicLinks()
      .getInitialLink()
      .then((link) => {
        const lastInitialLink = store.get(lastInitialLinkStorageAtom)

        if (link !== null && lastInitialLink.lastLinkImported === link?.url) {
          console.info('Ignoring initial link as it was opened before')
          return
        }

        store.set(lastInitialLinkStorageAtom, {
          lastLinkImported: link?.url ?? null,
        })

        if (link) {
          onLinkReceived(link)
        }
      })
      .catch((err) => {
        reportError('warn', new Error('Error while opening deep link'), {err})
        showErrorAlert({
          title: t('common.errorOpeningLink.message'),
          error: err,
        })
      })
    return dynamicLinks().onLink((link) => {
      if (link) {
        onLinkReceived(link)
      }
    })
  }, [onLinkReceived, store, t])
}

function isLinkVersionSupported(
  linkVersion: string | string[] | undefined
): Effect.Effect<boolean, ParseResult.ParseError, never> {
  return Effect.gen(function* (_) {
    const linkSemverVersion = yield* _(
      Schema.decodeUnknown(SemverStringE)(linkVersion)
    )

    return compareSemver(appVersion)('>=', linkSemverVersion)
  })
}

export const lastUniversalOrAppLinkStorageAtom = atomWithParsedMmkvStorage(
  'lastUniversalOrAppLink',
  {lastUniversalOrAppLinkImported: null},
  z.object({lastUniversalOrAppLinkImported: z.string().nullable()}).readonly()
)

export function useHandleUniversalAndAppLinks(): void {
  const store = useStore()
  const {t} = store.get(translationAtom)
  const url = Linking.useURL()
  const goldenAvatarType = store.get(goldenAvatarTypeAtom)
  const lastUniversalOrAppLink = store.get(lastUniversalOrAppLinkStorageAtom)
  const navigationState = navigationRef.getState()
  const passedImportContacts =
    navigationState?.routeNames?.includes('InsideTabs') ||
    navigationState?.routes?.some((route) => route.name === 'InsideTabs')

  const onLinkReceived = useCallback(() => {
    if (url && passedImportContacts) {
      if (lastUniversalOrAppLink.lastUniversalOrAppLinkImported === url) {
        console.info('Ignoring initial link as it was opened before')
        return
      }

      const {hostname, queryParams} = Linking.parse(url)

      switch (hostname) {
        case 'app.vexl.it':
          pipe(
            Effect.gen(function* (_) {
              const isLinkSupported = yield* _(
                isLinkVersionSupported(queryParams?.version)
              )

              if (!isLinkSupported) {
                Alert.alert(t('linking.linkNotSupportedPleaseUpdate'))
                return
              }

              if (
                queryParams?.link === LINK_TYPE_GOLDEN_GLASSES &&
                !goldenAvatarType
              ) {
                return yield* _(
                  store.set(handleGoldenGlassesDeepLinkActionAtom),
                  Effect.tap(() => {
                    store.set(lastUniversalOrAppLinkStorageAtom, {
                      lastUniversalOrAppLinkImported: url,
                    })
                  })
                )
              }
            }),
            Effect.catchAll((e) => {
              reportError('warn', new Error('Unknown deep link format'), {url})
              showErrorAlert({
                title: t('linking.wrongLinkFormatReceived', {link: url}),
                error: e,
              })
              return Effect.void
            }),
            Effect.runFork
          )

          break
        default:
          // do not report exp+vexl:// links that open the app in DEV mode
          if (!__DEV__)
            reportError('warn', new Error('Unknown deep link type'), {url})
      }
    }
  }, [
    goldenAvatarType,
    lastUniversalOrAppLink.lastUniversalOrAppLinkImported,
    passedImportContacts,
    store,
    t,
    url,
  ])

  useEffect(onLinkReceived, [onLinkReceived])
}
