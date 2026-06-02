import {
  Button,
  FilterBar,
  type FilterBarItem,
  Stack,
  XStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Array, Effect, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  normalizedContactsAtom,
  resolveAllContactsAsSeenActionAtom,
} from '../../../../state/contacts/atom/contactsStore'
import {type ContactsFilter} from '../../../../state/contacts/domain'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {runAfterAnimationFrame} from '../../../../utils/runAfterAnimationFrames'
import {useOnFocusAndAppState} from '../../../../utils/useFocusAndAppState'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import PreparingContactsOverlay from '../PreparingContactsOverlay'
import {contactSelectMolecule, ContactsSelectScope} from './atom'
import ContactsAccessPrivilegesInfoBanner from './components/ContactsAccessPrivilegesInfoBanner'
import ContactsListEmpty from './components/ContactsListEmpty'
import FilteredContacts from './components/FilteredContactsWithProvider'
import SearchBar from './components/SearchBar'
import SelectAllContactsCheckbox from './components/SelectAllContactsCheckbox'

function ContactsFilterBar({
  items,
  selectedFilter,
  onSelectedFilterChange,
}: {
  readonly items: ReadonlyArray<FilterBarItem<ContactsFilter>>
  readonly selectedFilter: ContactsFilter
  readonly onSelectedFilterChange: (filter: ContactsFilter) => void
}): React.ReactElement {
  const handleSelectedValuesChange = useCallback(
    (values: ReadonlySet<ContactsFilter>) => {
      pipe(
        Array.fromIterable(values),
        Array.findFirst((value) => value !== selectedFilter),
        Option.getOrElse(() => selectedFilter),
        onSelectedFilterChange
      )
    },
    [onSelectedFilterChange, selectedFilter]
  )

  return (
    <Stack height="$11" justifyContent="center">
      <FilterBar
        items={items}
        selectedValues={new Set([selectedFilter])}
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
    syncDefaultSelectedContactsActionAtom,
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
  const syncDefaultSelectedContacts = useSetAtom(
    syncDefaultSelectedContactsActionAtom
  )
  const [optimisticContactsFilter, setOptimisticContactsFilter] =
    useState<ContactsFilter>(filter ?? 'all')
  const [isContactsTabPreparing, setIsContactsTabPreparing] = useState(false)
  const [isSubmittingContacts, setIsSubmittingContacts] = useState(false)
  const latestOptimisticContactsFilterRef = useRef<ContactsFilter>(
    filter ?? 'all'
  )
  const cancelDeferredFilterFrameRef = useRef<(() => void) | undefined>(
    undefined
  )
  const cancelDeferredSubmitFrameRef = useRef<(() => void) | undefined>(
    undefined
  )
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
      cancelDeferredFilterFrameRef.current?.()
      cancelDeferredSubmitFrameRef.current?.()
    }
  }, [resolveAllContactsAsSeen])

  useOnFocusAndAppState(
    useCallback(() => {
      Effect.runFork(checkContactsAccessPrivileges())
    }, [checkContactsAccessPrivileges])
  )

  useEffect(() => {
    syncDefaultSelectedContacts(normalizedContacts)
  }, [normalizedContacts, syncDefaultSelectedContacts])

  useEffect(() => {
    const nextFilter = filter ?? 'all'
    cancelDeferredFilterFrameRef.current?.()
    cancelDeferredFilterFrameRef.current = undefined
    latestOptimisticContactsFilterRef.current = nextFilter
    setOptimisticContactsFilter(nextFilter)
    setIsContactsTabPreparing(false)
    setContactsFilter(nextFilter)
  }, [filter, setContactsFilter])

  const handleContactsFilterChange = useCallback(
    (nextFilter: ContactsFilter) => {
      if (latestOptimisticContactsFilterRef.current === nextFilter) return

      latestOptimisticContactsFilterRef.current = nextFilter
      setOptimisticContactsFilter(nextFilter)

      cancelDeferredFilterFrameRef.current?.()

      setIsContactsTabPreparing(true)
      cancelDeferredFilterFrameRef.current = runAfterAnimationFrame(() => {
        cancelDeferredFilterFrameRef.current = undefined
        setContactsFilter(nextFilter)
      })
    },
    [setContactsFilter]
  )

  const handleFilteredContactsReady = useCallback(
    (readyFilter: ContactsFilter) => {
      if (latestOptimisticContactsFilterRef.current === readyFilter) {
        setIsContactsTabPreparing(false)
      }
    },
    []
  )

  if (shouldShowEmptyContactsState) {
    return <ContactsListEmpty variant="emptyContacts" />
  }

  return (
    <Stack f={1} pos="relative">
      <Stack f={1}>
        <Stack px="$5" pb="$3" gap="$3">
          <ContactsAccessPrivilegesInfoBanner />
          <XStack alignItems="center" gap="$3">
            <Stack flex={1}>
              <SearchBar addContactRequestId={addContactRequestId} />
            </Stack>
            {areThereAnyContactsToDisplayForSelectedTab &&
            !isContactsTabPreparing ? (
              <SelectAllContactsCheckbox />
            ) : null}
          </XStack>
        </Stack>
        <ContactsFilterBar
          items={contactsFilterItems}
          selectedFilter={optimisticContactsFilter}
          onSelectedFilterChange={handleContactsFilterChange}
        />
        <Stack f={1} pos="relative">
          <FilteredContacts onReady={handleFilteredContactsReady} />
          <PreparingContactsOverlay
            visible={isContactsTabPreparing}
            zIndex={10}
          />
        </Stack>
      </Stack>
      <Stack px="$5" py="$4">
        <Button
          disabled={isSubmittingContacts}
          onPress={() => {
            if (isSubmittingContacts) return

            setIsSubmittingContacts(true)
            cancelDeferredSubmitFrameRef.current = runAfterAnimationFrame(
              () => {
                cancelDeferredSubmitFrameRef.current = undefined
                void Effect.runPromise(
                  andThenExpectBooleanNoErrors((success) => {
                    if (success) goBack()
                  })(submitAllSelectedContacts())
                ).finally(() => {
                  setIsSubmittingContacts(false)
                })
              }
            )
          }}
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
