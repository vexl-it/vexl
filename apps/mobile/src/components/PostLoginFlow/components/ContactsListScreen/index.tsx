import ContactsListSelect from '../../../ContactListSelect'
import {type PostLoginFlowScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {contactsLoadingAtom} from '../../../../state/contacts/atom/contactsFromDeviceAtom'

type Props = PostLoginFlowScreenProps<'ImportContacts'>

function ContactsListScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const contactsLoading = useAtomValue(contactsLoadingAtom)
  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={3} />
      <ContactsListSelect
        showNewByDefault={false}
        onContactsSubmitted={() => {
          navigation.push('AllowNotificationsExplanation')
        }}
        renderFooter={({onSubmit}) => {
          return (
            <NextButtonProxy
              text={t('postLoginFlow.importContactsButton')}
              onPress={onSubmit}
              disabled={contactsLoading}
            />
          )
        }}
      />
    </>
  )
}

export default ContactsListScreen
