import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import * as O from 'fp-ts/Option'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {useEffect, useMemo} from 'react'
import {Stack} from 'tamagui'
import {
  normalizedContactsAtom,
  resolveAllContactsAsSeenActionAtom,
} from '../../../../state/contacts/atom/contactsStore'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import WhiteContainer from '../../../WhiteContainer'
import {ContactsSelectScope, contactSelectMolecule} from './atom'
import AddContactRow from './components/AddContactRow'
import ContactsFilter from './components/ContactsFilter'
import ContactsList from './components/ContactsList'
import NothingFound from './components/NothingFound'
import SearchBar from './components/SearchBar'

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
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const submit = useSetAtom(submitActionAtom)

  useEffect(() => {
    return () => {
      // TODO: Contacts - race condition with contacts fetching to display
      resolveAllContactsAsSeen()
    }
  }, [resolveAllContactsAsSeen])

  return (
    <NormalizeContactsWithLoadingScreen>
      <WhiteContainer noPadding>
        <Stack f={1} px="$4">
          <SearchBar />
          {!!showFilter && <ContactsFilter />}
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
    </NormalizeContactsWithLoadingScreen>
  )
}

export default function ContactListSelectWithProvider(
  props: Props
): JSX.Element {
  const store = useStore()
  const importedContacts = useMemo(
    () => store.get(normalizedContactsAtom),
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
