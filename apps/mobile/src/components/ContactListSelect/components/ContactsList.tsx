import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {FlatList} from 'react-native'
import ContactItem from './ContactItem'
import ListHeader from './ListHeader'
import ListFooter from './ListFooter'
import {Stack} from 'tamagui'

interface Props {
  contacts: ContactNormalized[]
}

function ContactsList({contacts}: Props): JSX.Element {
  return (
    <Stack f={1} bg="$white">
      <Stack pt="$4">
        <FlatList
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          data={contacts}
          ItemSeparatorComponent={() => <Stack h={16} />}
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
      </Stack>
    </Stack>
  )
}

export default ContactsList
