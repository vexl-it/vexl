import {useCallback, useEffect} from 'react'
import dynamicLinks, {
  type FirebaseDynamicLinksTypes,
} from '@react-native-firebase/dynamic-links'
import reportError from '../reportError'
import {Alert} from 'react-native'
import {translationAtom, useTranslation} from '../localization/I18nProvider'
import parse from 'url-parse'
import {LINK_TYPE_IMPORT_CONTACT} from './domain'
import {atom, useSetAtom} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {parseJson, safeParse} from '../fpUtils'
import {ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {askAreYouSureActionAtom} from '../../components/AreYouSureDialog'
import {importContactFromLinkActionAtom} from '../../state/contacts'
import {loadingOverlayDisplayedAtom} from '../../components/LoadingOverlayProvider'
import {toCommonErrorMessage} from '../useCommonErrorMessages'

type DynamicLink = FirebaseDynamicLinksTypes.DynamicLink

const handleImportDeepContactActionAtom = atom(
  null,
  (get, set, contactJsonString: string) =>
    pipe(
      parseJson(contactJsonString),
      E.chainW(safeParse(ImportContactFromLinkPayload)),
      TE.fromEither,
      TE.chainFirstW((contact) =>
        set(askAreYouSureActionAtom, {
          steps: [
            {
              title: get(translationAtom).t(
                'deepLinks.importContacts.alert.title'
              ),
              description: get(translationAtom).t(
                'deepLinks.importContacts.alert.text',
                {
                  contactName: contact.name,
                  contactNumber: contact.numberToDisplay,
                }
              ),
              positiveButtonText: get(translationAtom).t('common.yes'),
              negativeButtonText: get(translationAtom).t('common.no'),
            },
          ],
          variant: 'info',
        })
      ),
      TE.map((r) => {
        set(loadingOverlayDisplayedAtom, true)
        return r
      }),
      TE.chainW((payload) => set(importContactFromLinkActionAtom, payload)),
      TE.map((r) => {
        set(loadingOverlayDisplayedAtom, false)
        return r
      }),
      TE.chainFirstW(() =>
        set(askAreYouSureActionAtom, {
          steps: [
            {
              title: get(translationAtom).t('common.success'),
              description: get(translationAtom).t(
                'deepLinks.importContacts.successAlert.title'
              ),
              positiveButtonText: get(translationAtom).t('common.nice'),
            },
          ],
          variant: 'info',
        })
      ),
      TE.match(
        (l) => {
          set(loadingOverlayDisplayedAtom, false)
          if (l._tag === 'UserDeclinedError') {
            return
          }

          if (l._tag !== 'NetworkError') {
            reportError('error', 'Error while importing contact from link', l)
          }

          Alert.alert(
            toCommonErrorMessage(l, get(translationAtom).t) ??
              get(translationAtom).t('common.unknownError')
          )
        },
        () => {
          // Everything in its right place
        }
      )
    )
)

export function useHandleDeepLink(): void {
  const {t} = useTranslation()
  const handleImportDeepContact = useSetAtom(handleImportDeepContactActionAtom)

  const onLinkReceived = useCallback(
    (link: DynamicLink) => {
      const url = link.url
      const parsedUrl = parse(url, true)

      switch (parsedUrl.query.type) {
        case LINK_TYPE_IMPORT_CONTACT:
          if (parsedUrl.query.data) {
            void handleImportDeepContact(parsedUrl.query.data)()
          }
          break
        default:
          reportError('warn', 'Unknown deep link type', {url})
      }
    },
    [handleImportDeepContact]
  )

  useEffect(() => {
    dynamicLinks()
      .getInitialLink()
      .then((link) => {
        if (link) {
          console.log('In getInitialLink')
          onLinkReceived(link)
        }
      })
      .catch((err) => {
        reportError('warn', 'Error while opening deep link', err)
        Alert.alert(t('common.errorOpeningLink.message'))
      })
    return dynamicLinks().onLink((link) => {
      if (link) {
        console.log('In onLink')
        onLinkReceived(link)
      }
    })
  }, [onLinkReceived, t])
}
