import {Banner} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {Linking, Platform} from 'react-native'
import {Stack, type StackProps} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function ContactsAccessPrivilegesInfoBanner(
  props: StackProps
): React.ReactElement | null {
  const {t} = useTranslation()
  const {
    contactsAccessPrivilegesAtom,
    displayInfoAboutContactsAccessPrivilegesAtom,
    shouldOpenContactsSettingsAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsAccessPrivileges = useAtomValue(contactsAccessPrivilegesAtom)
  const shouldOpenContactsSettings = useAtomValue(
    shouldOpenContactsSettingsAtom
  )
  const displayInfoAboutContactsAccessPrivileges = useAtomValue(
    displayInfoAboutContactsAccessPrivilegesAtom
  )
  const setDisplayInfoAboutContactsAccessPrivileges = useSetAtom(
    displayInfoAboutContactsAccessPrivilegesAtom
  )

  if (shouldOpenContactsSettings) {
    return (
      <Stack {...props}>
        <Banner
          color="pink"
          title={t('contactPreferences.emptyContacts.allowAccessTitle')}
          description={t(
            'contactPreferences.emptyContacts.allowAccessDescription'
          )}
          primaryButton={{
            label: t('contactPreferences.emptyContacts.allowAccessInSettings'),
            onPress: () => {
              void Linking.openSettings()
            },
          }}
        />
      </Stack>
    )
  }

  if (
    Platform.OS !== 'ios' ||
    contactsAccessPrivileges !== 'limited' ||
    !displayInfoAboutContactsAccessPrivileges
  )
    return null

  return (
    <Stack {...props}>
      <Banner
        color="pink"
        title={t('contacts.limitedAccessToContacts')}
        description={t('contacts.vexlHasLimitedAccessToYourContacts')}
        primaryButton={{
          label: t('common.openSettings'),
          onPress: () => {
            void Linking.openSettings()
          },
        }}
        secondaryButton={{
          label: t('common.close'),
          onPress: () => {
            setDisplayInfoAboutContactsAccessPrivileges(false)
          },
        }}
      />
    </Stack>
  )
}

export default ContactsAccessPrivilegesInfoBanner
