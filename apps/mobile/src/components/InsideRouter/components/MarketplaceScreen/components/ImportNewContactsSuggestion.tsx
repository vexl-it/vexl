import {useNavigation} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import {type YStackProps} from 'tamagui'
import newlyAddedContactsToPhoneContactListAtom from '../../../../../state/contacts/atom/newlyAddedContactsToPhoneContactListAtom'
import resolveAllContactsAsSeenAtom from '../../../../../state/contacts/atom/resolveAllContactsAsSeenAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MarketplaceSuggestion from './MarketplaceSuggestion'

function ImportNewContactsSuggestion(props: YStackProps): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const newlyAddedContactsToPhoneContactList = useAtomValue(
    newlyAddedContactsToPhoneContactListAtom
  )
  const resolveAllContactsAsSeen = useSetAtom(resolveAllContactsAsSeenAtom)

  return newlyAddedContactsToPhoneContactList.length > 0 ? (
    <MarketplaceSuggestion
      buttonText={t('suggestion.importNow')}
      onButtonPress={() => {
        navigation.navigate('SetContacts', {showNew: true})
      }}
      onClosePress={() => {
        resolveAllContactsAsSeen()
      }}
      text={t('suggestion.importNewlyAddedContacts')}
      {...props}
    />
  ) : null
}

export default ImportNewContactsSuggestion
