import Image from '../../Image'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import addSvg from '../image/addSvg'
import {useAddCustomContact} from '../state/customContacts'
import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {useToggleContactSelection} from '../state/selectedContacts'
import {Stack, Text} from 'tamagui'
import {TouchableOpacity} from 'react-native'

function AddContactRow({contact}: {contact: ContactNormalized}): JSX.Element {
  const {t} = useTranslation()
  const addCustomContact = useAddCustomContact()
  const toggleContactSelection = useToggleContactSelection()

  return (
    <TouchableOpacity
      style={{flex: 1}}
      onPress={() => {
        addCustomContact(contact)
        toggleContactSelection(true, contact.normalizedNumber)
      }}
    >
      <Stack f={1} ai="center" jc="center">
        <Stack mb="$4">
          <Image source={addSvg} />
        </Stack>
        <Text col="$greyOnWhite">
          {t('postLoginFlow.contactsList.addContact', {
            number: contact.numberToDisplay,
          })}
        </Text>
      </Stack>
    </TouchableOpacity>
  )
}

export default AddContactRow
