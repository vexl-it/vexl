import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {privateApiAtom} from '../../../api'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import notEmpty from '../../../utils/notEmpty'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {syncConnectionsActionAtom} from '../../connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from '../../connections/atom/offerToConnectionsAtom'
import {type StoredContactWithComputedValues} from '../domain'
import {
  lastImportOfContactsAtom,
  normalizedContactsAtom,
  storedContactsAtom,
} from './contactsStore'
import loadContactsFromDeviceActionAtom from './loadContactsFromDeviceActionAtom'
import normalizeStoredContactsActionAtom from './normalizeStoredContactsActionAtom'

export const submitContactsActionAtom = atom(
  null,
  (
    get,
    set,
    params: {
      normalizeAndImportAll: boolean
      numbersToImport?: E164PhoneNumber[]
    }
  ) => {
    const contactApi = get(privateApiAtom).contact
    const {t} = get(translationAtom)

    set(loadingOverlayDisplayedAtom, true)

    const normalizeStoredContacts = pipe(
      set(loadContactsFromDeviceActionAtom),
      T.chain(() => set(normalizeStoredContactsActionAtom)),
      T.map(() => undefined)
    )

    return pipe(
      params.normalizeAndImportAll ? normalizeStoredContacts : T.Do,
      TE.fromTask,
      TE.map(() => {
        const allContacts = get(normalizedContactsAtom)

        if (!params.numbersToImport) {
          return allContacts
        }
        return params.numbersToImport
          .map(
            (oneNumberToImport): StoredContactWithComputedValues | undefined =>
              allContacts.find(
                (oneContact) =>
                  oneContact.computedValues.normalizedNumber ===
                  oneNumberToImport
              )
          )
          .filter(notEmpty)
      }),
      TE.chainFirstW((contacts) => {
        return contactApi.importContacts({
          contacts: contacts.map((one) => one.computedValues.hash),
        })
      }),
      TE.match(
        (e) => {
          if (e._tag !== 'NetworkError') {
            reportError('error', new Error('error while submitting contacts'), {
              e,
            })
          }

          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          return false
        },
        (contacts) => {
          const importedNumbers = new Set(
            contacts.map((one) => one.computedValues.normalizedNumber)
          )

          set(storedContactsAtom, (storedContact) =>
            storedContact.map((oneContact) =>
              oneContact.computedValues &&
              importedNumbers.has(oneContact.computedValues?.normalizedNumber)
                ? {
                    ...oneContact,
                    flags: {
                      ...oneContact.flags,
                      imported: true,
                    },
                  }
                : {...oneContact, flags: {...oneContact.flags, imported: false}}
            )
          )

          set(
            lastImportOfContactsAtom,
            IsoDatetimeString.parse(new Date().toISOString())
          )

          void set(syncConnectionsActionAtom)()
          void set(updateAllOffersConnectionsActionAtom, {
            isInBackground: false,
          })()
          return true
        }
      ),
      T.map((v) => {
        set(loadingOverlayDisplayedAtom, false)
        return v
      })
    )
  }
)
