import {Button, type FilterBarItem, Stack, XStack} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Array} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useMemo, useState} from 'react'
import {normalizedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {type ContactsFilter} from '../../../../state/contacts/domain'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import PreparingContactsOverlay from '../PreparingContactsOverlay'
import {contactSelectMolecule, ContactsSelectScope} from './atom'
import ContactsAccessPrivilegesInfoBanner from './components/ContactsAccessPrivilegesInfoBanner'
import ContactsFilterBar from './components/ContactsFilterBar'
import ContactsListEmpty from './components/ContactsListEmpty'
import FilteredContacts from './components/FilteredContactsWithProvider'
import SearchBar from './components/SearchBar'
import SelectAllContactsCheckbox from './components/SelectAllContactsCheckbox'
import useContactListSelectLifecycle from './hooks/useContactListSelectLifecycle'
import usePreparedContactsFilter from './hooks/usePreparedContactsFilter'
import useSubmitSelectedContacts from './hooks/useSubmitSelectedContacts'

function ContactsListSelect({
  addContactRequestId,
  filter,
}: {
  readonly addContactRequestId: number
  readonly filter?: ContactsFilter
}): React.ReactElement {
  const {t} = useTranslation()
  const {
    areThereAnyContactsToDisplayForSelectedTabAtom,
    isContactsPreparingAtom,
    newContactsToDisplayCountAtom,
  } = useMolecule(contactSelectMolecule)
  const normalizedContacts = useContactListSelectLifecycle()
  const isContactsPreparing = useAtomValue(isContactsPreparingAtom)
  const newContactsToDisplayCount = useAtomValue(newContactsToDisplayCountAtom)
  const areThereAnyContactsToDisplayForSelectedTab = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )
  const {selectedFilter, setSelectedFilter} = usePreparedContactsFilter(filter)
  const {isSubmittingContacts, submitSelectedContacts} =
    useSubmitSelectedContacts()

  const shouldShowEmptyContactsState =
    !Array.isNonEmptyArray(normalizedContacts) && addContactRequestId === 0

  const contactsFilterItems = useMemo(
    (): ReadonlyArray<FilterBarItem<ContactsFilter>> => [
      {
        label: t('postLoginFlow.contactsList.all'),
        value: 'all',
      },
      {
        label: t('postLoginFlow.contactsList.new'),
        value: 'new',
        badge: newContactsToDisplayCount > 0,
      },
      {
        label: t('postLoginFlow.contactsList.nonSubmitted'),
        value: 'nonSubmitted',
      },
      {
        label: t('postLoginFlow.contactsList.submitted'),
        value: 'submitted',
      },
    ],
    [newContactsToDisplayCount, t]
  )

  if (shouldShowEmptyContactsState) {
    return <ContactsListEmpty variant="emptyContacts" />
  }

  const isSelectAllContactsCheckboxDisabled =
    !areThereAnyContactsToDisplayForSelectedTab || isContactsPreparing

  return (
    <Stack f={1} pos="relative">
      <Stack f={1}>
        <Stack px="$5" pb="$3" gap="$3">
          <ContactsAccessPrivilegesInfoBanner />
          <XStack alignItems="center" gap="$3">
            <Stack flex={1}>
              <SearchBar addContactRequestId={addContactRequestId} />
            </Stack>
            <SelectAllContactsCheckbox
              disabled={isSelectAllContactsCheckboxDisabled}
            />
          </XStack>
        </Stack>
        <ContactsFilterBar
          items={contactsFilterItems}
          selectedFilter={selectedFilter}
          onSelectedFilterChange={setSelectedFilter}
        />
        <Stack f={1} pos="relative">
          <FilteredContacts />
          <PreparingContactsOverlay visible={isContactsPreparing} zIndex={10} />
        </Stack>
      </Stack>
      <Stack px="$5" py="$4">
        <Button
          disabled={isSubmittingContacts}
          onPress={submitSelectedContacts}
        >
          {t('common.submit')}
        </Button>
      </Stack>
      <PreparingContactsOverlay
        labelKey="contacts.processingContacts"
        visible={isSubmittingContacts}
        zIndex={20}
      />
    </Stack>
  )
}

function ContactListSelectWithProviderComponent({
  addContactRequestId,
  filter,
}: {
  readonly addContactRequestId: number
  readonly filter?: ContactsFilter
}): React.ReactElement {
  const normalizedContacts = useAtomValue(normalizedContactsAtom)
  const [, setReloadContacts] = useState(0)

  return (
    <ScopeProvider
      scope={ContactsSelectScope}
      value={{
        normalizedContacts,
        reloadContacts: () => {
          setReloadContacts((v) => v + 1)
        },
      }}
    >
      <ContactsListSelect
        addContactRequestId={addContactRequestId}
        filter={filter}
      />
    </ScopeProvider>
  )
}

// This rerenders in PROD only therefore needs memo
export const ContactListSelectWithProvider = React.memo(
  ContactListSelectWithProviderComponent
)

export default function ContactListWithLoadStep({
  addContactRequestId,
  filter,
}: {
  readonly addContactRequestId: number
  readonly filter?: ContactsFilter
}): React.ReactElement {
  return (
    <NormalizeContactsWithLoadingScreen>
      <ContactListSelectWithProvider
        addContactRequestId={addContactRequestId}
        filter={filter}
      />
    </NormalizeContactsWithLoadingScreen>
  )
}
