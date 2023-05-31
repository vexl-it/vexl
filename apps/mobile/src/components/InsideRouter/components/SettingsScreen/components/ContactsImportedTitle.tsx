import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {YStack} from 'tamagui'
import {ItemText, SubtitleText} from './ButtonsSection'
import {importedContactsCountAtom} from '../../../../../state/contacts'

function ContactsImportedTitle(): JSX.Element {
  const {t} = useTranslation()
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  return (
    <YStack>
      <ItemText ff="$body500" col="$white">
        {t('settings.items.contactsImported')}
      </ItemText>
      <SubtitleText>
        {t('settings.items.xFriends', {number: importedContactsCount})}
      </SubtitleText>
    </YStack>
  )
}

export default ContactsImportedTitle
