import ContactsList from './components/ContactsList'
import SearchBar from './components/SearchBar'
import * as O from 'fp-ts/Option'
import AddContactRow from './components/AddContactRow'
import NothingFound from './components/NothingFound'
import WhiteContainer from '../WhiteContainer'
import {Stack} from 'tamagui'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {importedContactsAtom} from '../../state/contacts'
import {useMemo} from 'react'
import {contactSelectMolecule, ContactsSelectScope} from './atom'
import {ScopeProvider, useMolecule} from 'jotai-molecules'

interface Props {
  onContactsSubmitted: () => void
  renderFooter: (args: {onSubmit: () => void}) => JSX.Element
}

function ContactsListSelect({
  onContactsSubmitted,
  renderFooter,
}: Props): JSX.Element {
  const {
    searchTextAsCustomContactAtom,
    contactsToDisplayAtomsAtom,
    submitActionAtom,
  } = useMolecule(contactSelectMolecule)
  const customContactToAdd = useAtomValue(searchTextAsCustomContactAtom)
  const toDisplay = useAtomValue(contactsToDisplayAtomsAtom)
  const submit = useSetAtom(submitActionAtom)

  return (
    <>
      <WhiteContainer noPadding>
        <Stack f={1} px="$4">
          <SearchBar />
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
    <ScopeProvider scope={ContactsSelectScope} value={importedContacts}>
      <ContactsListSelect {...props} />
    </ScopeProvider>
  )
}
