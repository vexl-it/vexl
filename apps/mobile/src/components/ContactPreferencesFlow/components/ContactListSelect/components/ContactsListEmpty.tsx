import {type TranslationKey} from '@vexl-next/localization/src/translations'
import {EmptyState} from '@vexl-next/ui'
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
      <EmptyState
        paddingHorizontal="$7"
        title={t(
          variant === 'noContactsInSelectedFilter'
            ? 'contactPreferences.emptyContacts.noContactsInSelectedFilter.title'
            : 'contactPreferences.noMatchingContacts'
        )}
        description={t(
          variant === 'noContactsInSelectedFilter'
            ? 'contactPreferences.emptyContacts.noContactsInSelectedFilter.description'
            : 'postLoginFlow.contactsList.nothingFound.searchOrFiltersText'
        )}
      />
    )
  }

  const emptyContactsState: EmptyContactsState = shouldOpenContactsSettings
    ? 'allowAccess'
    : hasLimitedContactsAccess
      ? 'limitedAccess'
      : 'importFromPhone'
  const copy = emptyContactsCopy[emptyContactsState]

  return (
    <EmptyState
      flex={1}
      paddingHorizontal="$7"
      title={t(copy.title)}
      description={t(copy.description)}
      action={{
        label: t(copy.button),
        onPress: () => {
          if (emptyContactsState === 'importFromPhone') {
            Effect.runFork(importContactsFromPhone({requestPermissions: true}))
            return
          }

          void Linking.openSettings()
        },
      }}
    />
  )
}

export default ContactsListEmpty
