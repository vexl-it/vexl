import Image from '../../Image'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import addSvg from '../image/addSvg'
import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {Stack, Text} from 'tamagui'
import {TouchableOpacity} from 'react-native'
import {useMolecule} from 'jotai-molecules'
import {contactSelectMolecule} from '../atom'
import {useSetAtom} from 'jotai'

function AddContactRow({contact}: {contact: ContactNormalized}): JSX.Element {
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
            number: contact.numberToDisplay,
          })}
        </Text>
      </Stack>
    </TouchableOpacity>
  )
}

export default AddContactRow
