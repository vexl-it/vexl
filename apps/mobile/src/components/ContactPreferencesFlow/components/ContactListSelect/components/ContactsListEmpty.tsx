import {type TranslationKey} from '@vexl-next/localization/src/translations'
import {Button, Stack, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Linking} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

export type ContactsListEmptyVariant =
  | 'noMatchingContacts'
  | 'noContactsInSelectedFilter'
  | 'emptyContacts'

interface Props {
  readonly variant?: ContactsListEmptyVariant
}

type EmptyContactsState = 'importFromPhone' | 'allowAccess' | 'limitedAccess'

const emptyContactsCopy: Record<
  EmptyContactsState,
  Record<'title' | 'description' | 'button', TranslationKey>
> = {
  importFromPhone: {
    title: 'contactPreferences.emptyContacts.title',
    description: 'contactPreferences.emptyContacts.description',
    button: 'contactPreferences.emptyContacts.importFromPhone',
  },
  allowAccess: {
    title: 'contactPreferences.emptyContacts.allowAccessTitle',
    description: 'contactPreferences.emptyContacts.allowAccessDescription',
    button: 'contactPreferences.emptyContacts.allowAccessInSettings',
  },
  limitedAccess: {
    title: 'contactPreferences.emptyContacts.limitedAccessTitle',
    description: 'contactPreferences.emptyContacts.limitedAccessDescription',
    button: 'contactPreferences.emptyContacts.allowAccessInSettings',
  },
}

function ContactsListEmpty({
  variant = 'noMatchingContacts',
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {
    importContactsFromPhoneActionAtom,
    shouldOpenContactsSettingsAtom,
    hasLimitedContactsAccessAtom,
  } = useMolecule(contactSelectMolecule)
  const importContactsFromPhone = useSetAtom(importContactsFromPhoneActionAtom)
  const shouldOpenContactsSettings = useAtomValue(
    shouldOpenContactsSettingsAtom
  )
  const hasLimitedContactsAccess = useAtomValue(hasLimitedContactsAccessAtom)

  if (
    variant === 'noMatchingContacts' ||
    variant === 'noContactsInSelectedFilter'
  ) {
    return (
      <Stack width="100%" pt="$5">
        <Stack width="100%" px="$7" py="$7" gap="$5" alignItems="center">
          <Typography
            width="100%"
            textAlign="center"
            color="$foregroundPrimary"
            variant="heading3"
          >
            {t(
              variant === 'noContactsInSelectedFilter'
                ? 'contactPreferences.emptyContacts.noContactsInSelectedFilter.title'
                : 'contactPreferences.noMatchingContacts'
            )}
          </Typography>
          <Typography
            width="100%"
            textAlign="center"
            color="$foregroundSecondary"
            variant="description"
          >
            {t(
              variant === 'noContactsInSelectedFilter'
                ? 'contactPreferences.emptyContacts.noContactsInSelectedFilter.description'
                : 'postLoginFlow.contactsList.nothingFound.searchOrFiltersText'
            )}
          </Typography>
        </Stack>
      </Stack>
    )
  }

  const emptyContactsState: EmptyContactsState = shouldOpenContactsSettings
    ? 'allowAccess'
    : hasLimitedContactsAccess
      ? 'limitedAccess'
      : 'importFromPhone'
  const copy = emptyContactsCopy[emptyContactsState]

  return (
    <Stack flex={1} px="$5" pt="$10">
      <Stack width="100%" px="$6" py="$6" gap="$5" alignItems="center">
        <Typography
          width="100%"
          textAlign="center"
          color="$foregroundPrimary"
          variant="heading3"
        >
          {t(copy.title)}
        </Typography>
        <Typography
          width="100%"
          textAlign="center"
          color="$foregroundSecondary"
          variant="description"
        >
          {t(copy.description)}
        </Typography>
        <Button
          width="100%"
          size="small"
          variant="tertiary"
          onPress={() => {
            if (emptyContactsState === 'importFromPhone') {
              Effect.runFork(
                importContactsFromPhone({requestPermissions: true})
              )
              return
            }

            void Linking.openSettings()
          }}
        >
          {t(copy.button)}
        </Button>
      </Stack>
    </Stack>
  )
}

export default ContactsListEmpty
