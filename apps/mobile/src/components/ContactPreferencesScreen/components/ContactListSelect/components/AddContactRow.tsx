import {
  AddUserPersonContact,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function AddContactRow({
  contact,
}: {
  readonly contact: StoredContactWithComputedValues
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const {addAndSelectContactWithUiFeedbackAtom} = useMolecule(
    contactSelectMolecule
  )
  const addAndSelectContact = useSetAtom(addAndSelectContactWithUiFeedbackAtom)

  return (
    <Stack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="$4"
      px="$6"
    >
      <IconButton
        testID="@addContactRow/addNewContactButton"
        backgroundColor="$backgroundTertiary"
        onPress={() => {
          Effect.runFork(addAndSelectContact(contact))
        }}
      >
        <AddUserPersonContact size={24} color={theme.foregroundPrimary.get()} />
      </IconButton>
      <Typography
        variant="description"
        color="$foregroundSecondary"
        textAlign="center"
      >
        {t('postLoginFlow.contactsList.addContactManually', {
          number: contact.info.numberToDisplay,
        })}
      </Typography>
    </Stack>
  )
}

export default AddContactRow
