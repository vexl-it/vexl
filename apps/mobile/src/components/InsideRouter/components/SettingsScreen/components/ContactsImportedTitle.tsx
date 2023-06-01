import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {styled, Text, YStack} from 'tamagui'
import {importedContactsCountAtom} from '../../../../../state/contacts'

const ItemText = styled(Text, {
  fos: 18,
})

const SubtitleText = styled(Text, {
  fos: 12,
  col: '$greyOnBlack',
})

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
