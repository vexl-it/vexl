import {useNavigation} from '@react-navigation/native'
import {type YStackProps} from 'tamagui'
import {resolveAllContactsAsSeenActionAtom} from '../../../../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

function ImportNewContactsSuggestion(props: YStackProps): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <MarketplaceSuggestion
      buttonText={t('suggestion.importNow')}
      onButtonPress={() => {
        navigation.navigate('SetContacts', {filter: 'new'})
      }}
      text={t('suggestion.importNewlyAddedContacts')}
      visibleStateAtom={resolveAllContactsAsSeenActionAtom}
      {...props}
    />
  )
}

export default ImportNewContactsSuggestion
