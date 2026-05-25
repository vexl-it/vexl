import {Button, Stack, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Linking} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

interface Props {
  readonly variant?: 'noMatchingContacts' | 'emptyContacts'
}

function ContactsListEmpty({
  variant = 'noMatchingContacts',
}: Props): React.ReactElement {
  const {t} = useTranslation()
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
      </Stack>
    </Stack>
  )
}

export default ContactsListEmpty
