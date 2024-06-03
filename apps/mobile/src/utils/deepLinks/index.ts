import dynamicLinks, {
  type FirebaseDynamicLinksTypes,
} from '@react-native-firebase/dynamic-links'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import parse from 'url-parse'
import {addContactWithUiFeedbackAtom} from '../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {hashPhoneNumber} from '../../state/contacts/utils'
import {parseJson, safeParse} from '../fpUtils'
import {translationAtom, useTranslation} from '../localization/I18nProvider'
import reportError from '../reportError'
import showErrorAlert from '../showErrorAlert'
import {LINK_TYPE_ENCRYPTED_URL, LINK_TYPE_IMPORT_CONTACT} from './domain'
import {processEncryptedUrlActionAtom} from './encryptedUrl'

type DynamicLink = FirebaseDynamicLinksTypes.DynamicLink

export const handleImportDeepContactActionAtom = atom(
  null,
  (get, set, contactJsonString: string) => {
    const {t} = get(translationAtom)
    return pipe(
      parseJson(contactJsonString),
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

export function useHandleDeepLink(): void {
  const {t} = useTranslation()
  const handleImportDeepContact = useSetAtom(handleImportDeepContactActionAtom)
  const processEncryptedUrl = useSetAtom(processEncryptedUrlActionAtom)

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
        case LINK_TYPE_ENCRYPTED_URL:
          if (parsedUrl.query.data) {
            processEncryptedUrl(parsedUrl.query.data)
          }
          break
        default:
          reportError('warn', new Error('Unknown deep link type'), {url})
      }
    },
    [handleImportDeepContact, processEncryptedUrl]
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
  }, [onLinkReceived, t])
}
