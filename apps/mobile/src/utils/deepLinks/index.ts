import {useCallback, useEffect} from 'react'
import dynamicLinks, {
  type FirebaseDynamicLinksTypes,
} from '@react-native-firebase/dynamic-links'
import reportError from '../reportError'
import {translationAtom, useTranslation} from '../localization/I18nProvider'
import parse from 'url-parse'
import {LINK_TYPE_IMPORT_CONTACT} from './domain'
import {atom, useSetAtom} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {parseJson, safeParse} from '../fpUtils'
import {ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {addContactWithUiFeedbackAtom} from '../../state/contacts/atom/addContactWithUiFeedbackAtom'
import showErrorAlert from '../showErrorAlert'

type DynamicLink = FirebaseDynamicLinksTypes.DynamicLink

export const handleImportDeepContactActionAtom = atom(
  null,
  (get, set, contactJsonString: string) => {
    const {t} = get(translationAtom)
    return pipe(
      parseJson(contactJsonString),
      TE.fromEither,
      TE.chainEitherKW(safeParse(ImportContactFromLinkPayload)),
      TE.match(
        (e) => {
          reportError(
            'warn',
            'Error while parsing phone number from QR code',
            e
          )
          showErrorAlert({
            title: t('common.errorWhileReadingQrCode'),
            error: e,
          })
          return false
        },
        (contact) => {
          void set(addContactWithUiFeedbackAtom, {
            name: contact.name,
            normalizedNumber: E164PhoneNumber.parse(contact.numberToDisplay),
            fromContactList: false,
            numberToDisplay: contact.numberToDisplay,
          })
          return true
        }
      )
    )
  }
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
          onLinkReceived(link)
        }
      })
      .catch((err) => {
        reportError('warn', 'Error while opening deep link', err)
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
  }, [onLinkReceived, t])
}
