import {NavigationBar, Screen, Stack, XmarkCancelClose} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useEffect} from 'react'
import {type ContactPreferencesStackScreenProps} from '../../navigationTypes'
import {contactByNormalizedNumberAtom} from '../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import AddNewContactForm from '../ContactPreferencesFlow/components/ContactListSelect/components/AddNewContactForm'

type Props = ContactPreferencesStackScreenProps<'AddNewContact'>

export default function AddNewContactScreen({
  route: {params},
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
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
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: safeGoBack,
            },
          ]}
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
