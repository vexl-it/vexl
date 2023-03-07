import styled from '@emotion/native'
import Image from '../../Image'
import Text from '../../Text'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import addSvg from '../image/addSvg'
import {useAddCustomContact} from '../state/customContacts'
import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {useToggleContactSelection} from '../state/selectedContacts'

const RootContainer = styled.TouchableOpacity`
  flex: 1;
`
const InnerContainer = styled.View`
  align-items: center;
  justify-content: center;
  flex: 1;
`
const AddIcon = styled(Image)`
  margin-bottom: 16px;
`
const TextStyled = styled(Text)``

function AddContactRow({contact}: {contact: ContactNormalized}): JSX.Element {
  const {t} = useTranslation()
  const addCustomContact = useAddCustomContact()
  const toggleContactSelection = useToggleContactSelection()

  return (
    <RootContainer
      onPress={() => {
        addCustomContact(contact)
        toggleContactSelection(true, contact.normalizedNumber)
      }}
    >
      <InnerContainer>
        <AddIcon source={addSvg} />
        <TextStyled colorStyle="grayOnWhite">
          {t('postLoginFlow.contactsList.addContact', {
            number: contact.numberToDisplay,
          })}
        </TextStyled>
      </InnerContainer>
    </RootContainer>
  )
}

export default AddContactRow
