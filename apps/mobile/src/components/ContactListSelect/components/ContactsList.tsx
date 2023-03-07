import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {FlatList} from 'react-native'
import ContactItem from './ContactItem'
import styled, {css} from '@emotion/native'
import ListHeader from './ListHeader'
import ListFooter from './ListFooter'

const Container = styled.View`
  background-color: ${({theme}) => theme.colors.white};
  flex: 1;
`

const Separator = styled.View`
  height: 16px;
`

interface Props {
  contacts: ContactNormalized[]
}

function ContactsList({contacts}: Props): JSX.Element {
  return (
    <Container>
      <FlatList
        // Use css prop otherwise typechecking breaks
        style={css`
          padding-top: 16px;
        `}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        data={contacts}
        ItemSeparatorComponent={Separator}
        keyExtractor={(item) =>
          `${item.normalizedNumber}-${item.numberToDisplay}-${
            item.name
          }-${item.fromContactList.toString()}`
        }
        renderItem={({item}) => {
          return (
            <ContactItem
              numberToDisplay={item.numberToDisplay}
              normalizedNumber={item.normalizedNumber}
              name={item.name}
              imageUri={item.imageUri}
            />
          )
        }}
      />
    </Container>
  )
}

export default ContactsList
