import {
  ChevronLeft,
  FileImport,
  NavigationBar,
  Screen,
  Stack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {type ContactPreferencesStackScreenProps} from '../../navigationTypes'
import {contactByNormalizedNumberAtom} from '../../state/contacts/atom/contactsStore'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {contactSelectMolecule} from '../ContactPreferencesFlow/components/ContactListSelect/atom'
import AddNewContactForm from '../ContactPreferencesFlow/components/ContactListSelect/components/AddNewContactForm'

type Props = ContactPreferencesStackScreenProps<'AddNewContact'>

export default function AddNewContactScreen({
  route: {params},
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const {
    importVexlOnlyContactsActionAtom,
    resetContactsFilterFromRouteActionAtom,
  } = useMolecule(contactSelectMolecule)
  const importVexlOnlyContacts = useSetAtom(importVexlOnlyContactsActionAtom)
  const resetContactsFilterFromRoute = useSetAtom(
    resetContactsFilterFromRouteActionAtom
  )
  const editContactNumber = params?.editContactNumber
  const contactToEditFromStore = useAtomValue(
    contactByNormalizedNumberAtom(editContactNumber)
  )
  const [contactToEdit, setContactToEdit] = React.useState(
    contactToEditFromStore
  )
  const isEditingContact = contactToEdit !== undefined

  useEffect(() => {
    if (editContactNumber === undefined) {
      setContactToEdit(undefined)
      return
    }

    if (contactToEditFromStore !== undefined) {
      setContactToEdit(contactToEditFromStore)
    }
  }, [contactToEditFromStore, editContactNumber])

  const handleImportFromFile = useCallback(() => {
    Effect.runFork(
      Effect.promise(dismissKeyboardAndResolveOnLayoutUpdate).pipe(
        Effect.andThen(() => importVexlOnlyContacts()),
        Effect.andThen((importSuccessful) =>
          Effect.sync(() => {
            if (!importSuccessful) return
            // land on the "New" tab with this screen popped off the stack so
            // the back button won't return to the import screen
            resetContactsFilterFromRoute('new')
            navigation.popToTop()
          })
        )
      )
    )
  }, [importVexlOnlyContacts, navigation, resetContactsFilterFromRoute])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t(
            isEditingContact
              ? 'addContactDialog.editContact'
              : 'contactPreferences.addContactManually.title'
          )}
          leftAction={{
            icon: ChevronLeft,
            onPress: safeGoBack,
          }}
          rightActions={
            isEditingContact
              ? undefined
              : [
                  {
                    icon: FileImport,
                    onPress: handleImportFromFile,
                  },
                ]
          }
        />
      }
      noHorizontalPadding
    >
      <Stack flex={1}>
        <AddNewContactForm contactToEdit={contactToEdit} onClose={safeGoBack} />
      </Stack>
    </Screen>
  )
}
