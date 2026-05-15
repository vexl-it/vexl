import {useNavigation} from '@react-navigation/native'
import {Button, Separator, Stack, Typography, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Linking} from 'react-native'
import {type RootStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

interface Props {
  readonly variant?: 'noMatchingContacts' | 'emptyContacts'
}

function ContactsListEmpty({
  variant = 'noMatchingContacts',
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ContactPreferences'>['navigation']>()
  const {importContactsFromPhoneActionAtom, shouldOpenContactsSettingsAtom} =
    useMolecule(contactSelectMolecule)
  const importContactsFromPhone = useSetAtom(importContactsFromPhoneActionAtom)
  const shouldOpenContactsSettings = useAtomValue(
    shouldOpenContactsSettingsAtom
  )

  if (variant === 'noMatchingContacts') {
    return (
      <Stack width="100%" pt="$5">
        <Stack width="100%" px="$7" py="$7" gap="$5" alignItems="center">
          <Typography
            width="100%"
            textAlign="center"
            color="$foregroundPrimary"
            variant="heading3"
          >
            {t('contactPreferences.noMatchingContacts')}
          </Typography>
          <Typography
            width="100%"
            textAlign="center"
            color="$foregroundSecondary"
            variant="description"
          >
            {t('postLoginFlow.contactsList.nothingFound.searchOrFiltersText')}
          </Typography>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack flex={1} px="$5" pt="$10">
      <Stack width="100%" px="$6" py="$6" gap="$5" alignItems="center">
        <Typography
          width="100%"
          textAlign="center"
          color="$foregroundPrimary"
          variant="heading3"
        >
          {t(
            shouldOpenContactsSettings
              ? 'contactPreferences.emptyContacts.allowAccessTitle'
              : 'contactPreferences.emptyContacts.title'
          )}
        </Typography>
        <Typography
          width="100%"
          textAlign="center"
          color="$foregroundSecondary"
          variant="description"
        >
          {t(
            shouldOpenContactsSettings
              ? 'contactPreferences.emptyContacts.allowAccessDescription'
              : 'contactPreferences.emptyContacts.description'
          )}
        </Typography>
        <Button
          width="100%"
          size="small"
          variant="tertiary"
          onPress={() => {
            if (shouldOpenContactsSettings) {
              void Linking.openSettings()
              return
            }

            Effect.runFork(importContactsFromPhone())
          }}
        >
          {t(
            shouldOpenContactsSettings
              ? 'contactPreferences.emptyContacts.allowAccessInSettings'
              : 'contactPreferences.emptyContacts.importFromPhone'
          )}
        </Button>
        <XStack width="100%" alignItems="center" gap="$3">
          <Separator flex={1} borderColor="$foregroundTertiary" />
          <Typography color="$foregroundTertiary" variant="description">
            {t('common.or')}
          </Typography>
          <Separator flex={1} borderColor="$foregroundTertiary" />
        </XStack>
        <Button
          width="100%"
          size="small"
          variant="tertiary"
          onPress={() => {
            navigation.navigate('AddNewContact')
          }}
        >
          {t('contactPreferences.emptyContacts.addManually')}
        </Button>
      </Stack>
    </Stack>
  )
}

export default ContactsListEmpty
