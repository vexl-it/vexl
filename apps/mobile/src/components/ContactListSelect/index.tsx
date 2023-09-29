import ContactsList from './components/ContactsList'
import SearchBar from './components/SearchBar'
import * as O from 'fp-ts/Option'
import AddContactRow from './components/AddContactRow'
import NothingFound from './components/NothingFound'
import WhiteContainer from '../WhiteContainer'
import {getTokens, Stack} from 'tamagui'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {importedContactsAtom} from '../../state/contacts'
import {useCallback, useMemo} from 'react'
import {contactSelectMolecule, ContactsSelectScope} from './atom'
import {ScopeProvider, useMolecule} from 'jotai-molecules'
import ContactsFilter from './components/ContactsFilter'
import {ActivityIndicator} from 'react-native'
import {
  contactsLoadingAtom,
  triggerContactsReloadAtom,
} from '../../state/contacts/atom/contactsFromDeviceAtom'
import {useOnFocusAndAppState} from './utils'

interface Props {
  onContactsSubmitted: () => void
  renderFooter: (args: {onSubmit: () => void}) => JSX.Element
  showFilter?: boolean
  showNewByDefault: boolean
}

function ContactsListSelect({
  onContactsSubmitted,
  renderFooter,
  showFilter,
}: Props): JSX.Element {
  const {
    searchTextAsCustomContactAtom,
    contactsToDisplayAtomsAtom,
    submitActionAtom,
  } = useMolecule(contactSelectMolecule)
  const customContactToAdd = useAtomValue(searchTextAsCustomContactAtom)
  const toDisplay = useAtomValue(contactsToDisplayAtomsAtom)
  const loading = useAtomValue(contactsLoadingAtom)
  const submit = useSetAtom(submitActionAtom)
  const triggerContactsReload = useSetAtom(triggerContactsReloadAtom)

  useOnFocusAndAppState(
    useCallback(() => {
      triggerContactsReload()
    }, [triggerContactsReload])
  )

  if (loading)
    return (
      <WhiteContainer>
        <Stack alignItems={'center'} justifyContent={'center'} flex={1}>
          <ActivityIndicator size="large" color={getTokens().color.main.val} />
        </Stack>
      </WhiteContainer>
    )

  return (
    <>
      <WhiteContainer noPadding>
        <Stack f={1} px="$4">
          <SearchBar />
          {showFilter && <ContactsFilter />}
          {toDisplay.length > 0 && <ContactsList contacts={toDisplay} />}
          {toDisplay.length === 0 && !O.isSome(customContactToAdd) && (
            <NothingFound />
          )}
          {toDisplay.length === 0 && O.isSome(customContactToAdd) && (
            <AddContactRow contact={customContactToAdd.value} />
          )}
        </Stack>
      </WhiteContainer>
      {renderFooter({
        onSubmit: () => {
          void submit()().then((success) => {
            if (success) onContactsSubmitted()
          })
        },
      })}
    </>
  )
}

export default function ContactListSelectWithProvider(
  props: Props
): JSX.Element {
  const store = useStore()
  const importedContacts = useMemo(
    () => store.get(importedContactsAtom),
    [store]
  )

  return (
    <ScopeProvider
      scope={ContactsSelectScope}
      value={{
        importedContacts,
        initialFilters: {
          showNew: props.showNewByDefault,
          showNonSubmitted: false,
          showSubmitted: false,
        },
      }}
    >
      <ContactsListSelect {...props} />
    </ScopeProvider>
  )
}
