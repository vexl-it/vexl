import MarketplaceSuggestion from './MarketplaceSuggestion'
import {showNewContactsOnlyAtom} from '../../../../ContactListSelect/atom'
import {useAtomValue, useSetAtom} from 'jotai'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'
import newlyAddedContactsToPhoneContactListAtom from '../../../../../state/contacts/atom/newlyAddedContactsToPhoneContactListAtom'
import resolveAllContactsAsSeenAtom from '../../../../../state/contacts/atom/resolveAllContactsAsSeenAtom'

function ImportNewContactsSuggestion(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()

  const newlyAddedContactsToPhoneContactList = useAtomValue(
    newlyAddedContactsToPhoneContactListAtom
  )
  const resolveAllContactsAsSeen = useSetAtom(resolveAllContactsAsSeenAtom)
  const setShowNewContactsOnly = useSetAtom(showNewContactsOnlyAtom)

  return newlyAddedContactsToPhoneContactList.length > 0 ? (
    <MarketplaceSuggestion
      px={'$0'}
      buttonText={t('suggestion.addMoreContacts')}
      onButtonPress={() => {
        setShowNewContactsOnly(true)
        navigation.navigate('SetContacts')
      }}
      onClosePress={() => {
        resolveAllContactsAsSeen()
      }}
      text={t('suggestion.importNewlyAddedContacts')}
    />
  ) : null
}

export default ImportNewContactsSuggestion
