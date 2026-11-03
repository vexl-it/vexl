import {useNavigation} from '@react-navigation/native'
import {NavButton, PencilWriteEdit, PersonRow, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {type ContactPreferencesStackScreenProps} from '../../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import {ContactAvatar} from '../../../../ContactAvatar'
import {contactSelectMolecule} from '../atom'
import IsSelectedSwitch from './IsSelectedSwitch'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): React.ReactElement {
  const contact = useAtomValue(contactAtom)
  const navigation =
    useNavigation<
      ContactPreferencesStackScreenProps<'ContactPreferencesList'>['navigation']
    >()
  const {selectContactAtom} = useMolecule(contactSelectMolecule)
  const {
    info: {nonUniqueContactId, name},
    computedValues: {normalizedNumber},
  } = contact
  const isSelected = useAtomValue(selectContactAtom(normalizedNumber))

  return (
    <PersonRow
      testID="@contactItem"
      subtitleTestID="@contactItem/normalizedNumber"
      dimmed={!isSelected}
      avatar={
        <ContactAvatar
          contactId={nonUniqueContactId}
          size="$9"
          grayscale={!isSelected}
        />
      }
      title={name}
      subtitle={getInternationalPhoneNumber(normalizedNumber)}
      trailing={
        <XStack gap="$2" ai="center">
          <NavButton
            testID="@contactItem/edit"
            variant="normal"
            icon={PencilWriteEdit}
            onPress={() => {
              navigation.navigate('AddNewContact', {
                editContactNumber: normalizedNumber,
              })
            }}
          />
          <IsSelectedSwitch contactNumber={normalizedNumber} />
        </XStack>
      }
    />
  )
}

export default React.memo(ContactItem)
