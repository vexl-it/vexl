import ContactsList from './components/ContactsList'
import styled from '@emotion/native'
import SearchBar from './components/SearchBar'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {useSearchTextAsCustomContact} from './state/searchBar'
import AddContactRow from './components/AddContactRow'
import NothingFound from './components/NothingFound'
import {useContactsToDisplay} from './state/contactsToDisplay'
import {useImportContacts} from './api'
import {useShowLoadingOverlay} from '../LoadingOverlayProvider'
import {hmac} from '@vexl-next/cryptography'
import {useGetSelectedContacts} from './state/selectedContacts'
import {pipe} from 'fp-ts/function'
import {Alert} from 'react-native'
import WhiteContainer from '../WhiteContainer'

const RootContainer = styled(WhiteContainer)`
  flex: 1;
  background-color: ${({theme}) => theme.colors.white};
  padding-top: 0;
  padding-bottom: 0;
`

interface Props {
  onContactsSubmitted: () => void
  renderFooter: (args: {onSubmit: () => void}) => JSX.Element
}

function ContactsListSelect({
  onContactsSubmitted,
  renderFooter,
}: Props): JSX.Element {
  const searchTextAsCustomContact = useSearchTextAsCustomContact()
  const importContacts = useImportContacts()
  const loadingOverlay = useShowLoadingOverlay()
  const toDisplay = useContactsToDisplay()
  const getSelectedContacts = useGetSelectedContacts()

  function onSubmit(): void {
    loadingOverlay.show()
    const hashes = getSelectedContacts().map((one) =>
      hmac.hmacSign({password: 'VexlVexl', data: one})
    )

    void pipe(
      importContacts({contacts: hashes}),
      TE.match(
        (e) => {
          Alert.alert(e)
          loadingOverlay.hide()
        },
        () => {
          loadingOverlay.hide()
          onContactsSubmitted()
        }
      )
    )()
  }

  return (
    <RootContainer>
      <SearchBar />
      {toDisplay.length > 0 && <ContactsList contacts={toDisplay} />}
      {toDisplay.length === 0 && !O.isSome(searchTextAsCustomContact) && (
        <NothingFound />
      )}
      {toDisplay.length === 0 && O.isSome(searchTextAsCustomContact) && (
        <AddContactRow contact={searchTextAsCustomContact.value} />
      )}
      {renderFooter({onSubmit})}
    </RootContainer>
  )
}

export default function ContactListSelectWithProvider(
  props: Props
): JSX.Element {
  return <ContactsListSelect {...props} />
}
