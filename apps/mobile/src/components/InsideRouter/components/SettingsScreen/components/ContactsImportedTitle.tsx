import {useAtomValue, useSetAtom} from 'jotai'
import {styled, Text, YStack} from 'tamagui'
import {importedContactsCountAtom} from '../../../../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../../../utils/localization/localizedNumbersAtoms'

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
  const contactsCount = useSetAtom(localizedDecimalNumberActionAtom)({
    number: importedContactsCount,
  })

  return (
    <YStack>
      <ItemText ff="$body500" col="$white">
        {t('settings.items.contactsImported')}
      </ItemText>
      <SubtitleText>
        {t('settings.items.xFriends', {
          number: contactsCount,
        })}
      </SubtitleText>
    </YStack>
  )
}

export default ContactsImportedTitle
