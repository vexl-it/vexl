import ContactsListSelect from '../../../ContactListSelect'
import {type PostLoginFlowScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

type Props = PostLoginFlowScreenProps<'ImportContacts'>

function ContactsListScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={3} />
      <ContactsListSelect
        onContactsSubmitted={() => {
          navigation.push('AllowNotificationsExplanation')
        }}
        renderFooter={({onSubmit}) => {
          return (
            <NextButtonProxy
              text={t('postLoginFlow.importContactsButton')}
              onPress={onSubmit}
              disabled={false}
            />
          )
        }}
      />
    </>
  )
}

export default ContactsListScreen
