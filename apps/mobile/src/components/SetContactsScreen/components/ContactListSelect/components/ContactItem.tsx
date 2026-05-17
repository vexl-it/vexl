import {
  IconButton,
  PencilWriteEdit,
  Stack,
  Typography,
  UserImagePlaceholder,
  useTheme,
  XStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import ContactPictureImage from '../../../../ContactPictureImage'
import {contactSelectMolecule} from '../atom'
import IsNewIndicator from './IsNewIndicator'
import IsSelectedCheckbox from './IsSelectedCheckbox'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): React.ReactElement {
  const {editContactActionAtom} = useMolecule(contactSelectMolecule)
  const contact = useAtomValue(contactAtom)
  const editContact = useSetAtom(editContactActionAtom)
  const theme = useTheme()
  const {
    info: {nonUniqueContactId, name},
    computedValues: {normalizedNumber},
  } = contact

  return (
    <XStack testID="@contactItem" ai="center">
      <Stack>
        <IsNewIndicator contactAtom={contactAtom} />

        <ContactPictureImage
          contactId={nonUniqueContactId}
          width={50}
          height={50}
          br="$5"
          objectFit="cover"
          fallback={<UserImagePlaceholder size={50} />}
        />
      </Stack>
      <Stack f={1} ml="$4" jc="space-between">
        <Typography variant="paragraph" mb="$1" color="$foregroundPrimary">
          {name}
        </Typography>
        <Typography
          testID="@contactItem/normalizedNumber"
          variant="descriptionBold"
          color="$foregroundSecondary"
        >
          {getInternationalPhoneNumber(normalizedNumber)}
        </Typography>
      </Stack>
      <XStack gap="$2">
        <IconButton
          height={32}
          width={32}
          padding="$2"
          onPress={() => {
            Effect.runFork(editContact({contact}))
          }}
        >
          <PencilWriteEdit size={20} color={theme.foregroundPrimary.get()} />
        </IconButton>
        <IsSelectedCheckbox contactAtom={contactAtom} />
      </XStack>
    </XStack>
  )
}

export default React.memo(ContactItem)
