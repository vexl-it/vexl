import {PlusAdd, Stack, Typography, useTheme} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function AddContactRow({
  contact,
}: {
  contact: StoredContactWithComputedValues
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const {addAndSelectContactWithUiFeedbackAtom} = useMolecule(
    contactSelectMolecule
  )
  const addAndSelectContact = useSetAtom(addAndSelectContactWithUiFeedbackAtom)

  return (
    <Stack flex={1} alignItems="center" justifyContent="center">
      <TouchableOpacity
        testID="@addContactRow/addContactManuallyButton"
        onPress={() => {
          Effect.runFork(addAndSelectContact(contact))
        }}
      >
        <Stack f={1} ai="center" jc="center">
          <Stack mb="$4">
            <Stack
              width={38}
              height={38}
              borderRadius="$5"
              backgroundColor="$accentYellowPrimary"
              alignItems="center"
              justifyContent="center"
            >
              <PlusAdd size={24} color={theme.accentHighlightPrimary.get()} />
            </Stack>
          </Stack>
          <Typography
            variant="paragraph"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t('postLoginFlow.contactsList.addContactManually', {
              number: contact.info.numberToDisplay,
            })}
          </Typography>
        </Stack>
      </TouchableOpacity>
    </Stack>
  )
}

export default AddContactRow
