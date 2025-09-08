import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {Linking, Platform} from 'react-native'
import {Stack, type StackProps} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Info from '../../../../Info'
import {contactSelectMolecule} from '../atom'

function ContactsAccessPrivilegesInfoModal(
  props: StackProps
): React.ReactElement | null {
  const {t} = useTranslation()
  const {
    contactsAccessPrivilegesAtom,
    displayInfoAboutContactsAccessPrivilegesAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsAccessPrivileges = useAtomValue(contactsAccessPrivilegesAtom)

  if (Platform.OS !== 'ios' || contactsAccessPrivileges !== 'limited')
    return null

  return (
    <Stack {...props}>
      <Info
        visibleStateAtom={displayInfoAboutContactsAccessPrivilegesAtom}
        variant="yellow"
        text={t('contacts.vexlHasLimitedAccessToYourContacts')}
        actionButtonText={t('common.openSettings')}
        onActionPress={() => {
          void Linking.openSettings()
        }}
      />
    </Stack>
  )
}

export default ContactsAccessPrivilegesInfoModal
