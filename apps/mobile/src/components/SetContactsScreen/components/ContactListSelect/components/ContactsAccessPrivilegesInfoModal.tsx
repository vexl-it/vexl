import {
  Button,
  IconButton,
  InfoBox,
  Stack,
  useTheme,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {Linking, Platform} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function ContactsAccessPrivilegesInfoModal(
  props: React.ComponentProps<typeof Stack>
): React.ReactElement | null {
  const {t} = useTranslation()
  const theme = useTheme()
  const {
    contactsAccessPrivilegesAtom,
    displayInfoAboutContactsAccessPrivilegesAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsAccessPrivileges = useAtomValue(contactsAccessPrivilegesAtom)
  const [isVisible, setIsVisible] = useAtom(
    displayInfoAboutContactsAccessPrivilegesAtom
  )

  if (
    Platform.OS !== 'ios' ||
    contactsAccessPrivileges !== 'limited' ||
    !isVisible
  )
    return null

  return (
    <Stack {...props}>
      <YStack gap="$3">
        <Stack flexDirection="row" gap="$2" alignItems="flex-start">
          <InfoBox flex={1} variant="tertiary">
            {t('contacts.vexlHasLimitedAccessToYourContacts')}
          </InfoBox>
          <IconButton
            width="$9"
            height="$9"
            padding="$2"
            backgroundColor="$backgroundTertiary"
            onPress={() => {
              setIsVisible(false)
            }}
          >
            <XmarkCancelClose
              size={20}
              color={theme.foregroundSecondary.get()}
            />
          </IconButton>
        </Stack>
        <Button
          variant="secondary"
          size="medium"
          onPress={() => {
            void Linking.openSettings()
          }}
        >
          {t('common.openSettings')}
        </Button>
      </YStack>
    </Stack>
  )
}

export default ContactsAccessPrivilegesInfoModal
