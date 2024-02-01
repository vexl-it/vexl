import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, Text} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import {contactSelectMolecule} from '../atom'
import addSvg from '../image/addSvg'

function AddContactRow({
  contact,
}: {
  contact: StoredContactWithComputedValues
}): JSX.Element {
  const {t} = useTranslation()
  const {addAndSelectContactWithUiFeedbackAtom} = useMolecule(
    contactSelectMolecule
  )
  const addAndSelectContact = useSetAtom(addAndSelectContactWithUiFeedbackAtom)

  return (
    <TouchableOpacity
      style={{flex: 1}}
      onPress={() => {
        void addAndSelectContact(contact)
      }}
    >
      <Stack f={1} ai="center" jc="center">
        <Stack mb="$4">
          <Image source={addSvg} />
        </Stack>
        <Text col="$greyOnWhite">
          {t('postLoginFlow.contactsList.addContactManually', {
            number: contact.info.numberToDisplay,
          })}
        </Text>
      </Stack>
    </TouchableOpacity>
  )
}

export default AddContactRow
