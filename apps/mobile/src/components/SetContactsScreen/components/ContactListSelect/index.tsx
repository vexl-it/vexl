import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import * as O from 'fp-ts/Option'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {useEffect, useMemo, useState} from 'react'
import {AppState} from 'react-native'
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

export function ContactListSelectWithProvider(props: Props): JSX.Element {
  const [reloadContactsValue, setReloadContacts] = useState(0)

  const store = useStore()
  const normalizedContacts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    reloadContactsValue
    return store.get(normalizedContactsAtom)
  }, [store, reloadContactsValue])

  useEffect(() => {
    const listener = AppState.addEventListener('change', (event) => {
      if (event === 'active') setReloadContacts((v) => v + 1)
    })
    return () => {
      listener.remove()
    }
  }, [reloadContactsValue])

  return (
    <ScopeProvider
      scope={ContactsSelectScope}
      value={{
        normalizedContacts,
        initialFilters: {
          showNew: props.showNewByDefault,
          showNonSubmitted: false,
          showSubmitted: false,
        },
        reloadContacts: () => {
          setReloadContacts((v) => v + 1)
        },
      }}
    >
      <ContactsListSelect {...props} />
    </ScopeProvider>
  )
}

export default function ContactListWithLoadStep(props: Props): JSX.Element {
  return (
    <NormalizeContactsWithLoadingScreen>
      <ContactListSelectWithProvider {...props} />
    </NormalizeContactsWithLoadingScreen>
  )
}
