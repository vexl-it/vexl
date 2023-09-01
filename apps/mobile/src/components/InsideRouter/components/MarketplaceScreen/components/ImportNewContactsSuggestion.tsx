import MarketplaceSuggestion from './MarketplaceSuggestion'
import {useAtomValue, useSetAtom} from 'jotai'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'
import newlyAddedContactsToPhoneContactListAtom from '../../../../../state/contacts/atom/newlyAddedContactsToPhoneContactListAtom'
import resolveAllContactsAsSeenAtom from '../../../../../state/contacts/atom/resolveAllContactsAsSeenAtom'
import {type YStackProps} from 'tamagui'

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
        navigation.navigate('SetContacts')
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
