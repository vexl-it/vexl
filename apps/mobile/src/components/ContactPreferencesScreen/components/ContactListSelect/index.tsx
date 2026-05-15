import {
  Button,
  FilterBar,
  type FilterBarItem,
  Stack,
  XStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Array, Effect, Option, pipe} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  normalizedContactsAtom,
  resolveAllContactsAsSeenActionAtom,
} from '../../../../state/contacts/atom/contactsStore'
import {type ContactsFilter} from '../../../../state/contacts/domain'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useOnFocusAndAppState} from '../../../../utils/useFocusAndAppState'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import {contactSelectMolecule, ContactsSelectScope} from './atom'
import ContactsAccessPrivilegesInfoBanner from './components/ContactsAccessPrivilegesInfoBanner'
import ContactsListEmpty from './components/ContactsListEmpty'
import FilteredContacts from './components/FilteredContactsWithProvider'
import SearchBar from './components/SearchBar'
import SelectAllContactsCheckbox from './components/SelectAllContactsCheckbox'

function ContactsFilterBar({
  items,
}: {
  readonly items: ReadonlyArray<FilterBarItem<ContactsFilter>>
}): React.ReactElement {
  const {contactsFilterAtom} = useMolecule(contactSelectMolecule)
  const [contactsFilter, setContactsFilter] = useAtom(contactsFilterAtom)

  const handleSelectedValuesChange = useCallback(
    (values: ReadonlySet<ContactsFilter>) => {
      pipe(
        Array.fromIterable(values),
        Array.findFirst((value) => value !== contactsFilter),
        Option.getOrElse(() => contactsFilter),
        setContactsFilter
      )
    },
    [contactsFilter, setContactsFilter]
  )

  return (
    <Stack height="$11" justifyContent="center">
      <FilterBar
        items={items}
        selectedValues={new Set([contactsFilter])}
        onSelectedValuesChange={handleSelectedValuesChange}
        containerStyle={{marginLeft: '$5'}}
      />
    </Stack>
  )
}

function ContactsListSelect({
  addContactRequestId,
  filter,
}: {
  readonly addContactRequestId: number
  readonly filter?: ContactsFilter
}): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const {
    submitAllSelectedContactsActionAtom,
    checkContactsAccessPrivilegesActionAtom,
    contactsFilterAtom,
    areThereAnyContactsToDisplayForSelectedTabAtom,
    normalizedContacts,
  } = useMolecule(contactSelectMolecule)

  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const submitAllSelectedContacts = useSetAtom(
    submitAllSelectedContactsActionAtom
  )
  const checkContactsAccessPrivileges = useSetAtom(
    checkContactsAccessPrivilegesActionAtom
  )
  const setContactsFilter = useSetAtom(contactsFilterAtom)
  const areThereAnyContactsToDisplayForSelectedTab = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )

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
    [t]
  )

  useEffect(() => {
    return () => {
      resolveAllContactsAsSeen()
    }
  }, [resolveAllContactsAsSeen])

  useOnFocusAndAppState(
    useCallback(() => {
      Effect.runFork(checkContactsAccessPrivileges())
    }, [checkContactsAccessPrivileges])
  )

  useEffect(() => {
    setContactsFilter(filter ?? 'all')
  }, [filter, setContactsFilter])

  if (shouldShowEmptyContactsState) {
    return <ContactsListEmpty variant="emptyContacts" />
  }

  return (
    <Stack f={1}>
      <Stack f={1}>
        <Stack px="$5" pb="$3" gap="$3">
          <ContactsAccessPrivilegesInfoBanner />
          <XStack alignItems="center" gap="$3">
            <Stack flex={1}>
              <SearchBar addContactRequestId={addContactRequestId} />
            </Stack>
            {areThereAnyContactsToDisplayForSelectedTab ? (
              <SelectAllContactsCheckbox />
            ) : null}
          </XStack>
        </Stack>
        <ContactsFilterBar items={contactsFilterItems} />
        <FilteredContacts />
      </Stack>
      <Stack px="$5" py="$4">
        <Button
          onPress={() => {
            void Effect.runPromise(
              andThenExpectBooleanNoErrors((success) => {
                if (success) goBack()
              })(submitAllSelectedContacts())
            )
          }}
        >
          {t('common.submit')}
        </Button>
      </Stack>
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
