import {useNavigation} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import {type YStackProps} from 'tamagui'
import {
  areThereNewContactsAtom,
  resolveAllContactsAsSeenActionAtom,
} from '../../../../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from './MarketplaceSuggestion'

function ImportNewContactsSuggestion(props: YStackProps): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const areThereNewContacts = useAtomValue(areThereNewContactsAtom)
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )

  return areThereNewContacts ? (
    <MarketplaceSuggestion
      buttonText={t('suggestion.importNow')}
      onButtonPress={() => {
        navigation.navigate('SetContacts', {showNew: true})
      }}
      onClosePress={resolveAllContactsAsSeen}
      text={t('suggestion.importNewlyAddedContacts')}
      {...props}
    />
  ) : null
}

export default ImportNewContactsSuggestion
