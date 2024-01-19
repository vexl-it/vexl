import {Stack, Text, XStack} from 'tamagui'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import {TouchableWithoutFeedback} from 'react-native'
import Image from '../../Image'
import downArrow from '../../../images/downArrow'
import {searchTextAtom} from '../atoms/searchTextAtom'
import submitSearchActionAtom from '../atoms/submitSearchActionAtom'

function SearchSuggestionItem({atom}: {atom: Atom<string>}): JSX.Element {
  const value = useAtomValue(atom)
  const setText = useSetAtom(searchTextAtom)
  const submit = useSetAtom(submitSearchActionAtom)

  return (
    <XStack px="$2" alignItems="stretch" justifyContent="flex-start">
      <Stack my="$3" f={1}>
        <TouchableWithoutFeedback
          onPress={() => {
            submit(value)
          }}
        >
          <Text fos={18} fontFamily="$body600" color="$greyOnBlack">
            {value}
          </Text>
        </TouchableWithoutFeedback>
      </Stack>
      <TouchableWithoutFeedback
        onPress={() => {
          setText(value)
        }}
      >
        <Stack px="$2" alignItems="center" justifyContent="center">
          <Image
            fill="white"
            style={{transform: [{rotate: '135deg'}]}}
            source={downArrow}
          />
        </Stack>
      </TouchableWithoutFeedback>
    </XStack>
  )
}

export default SearchSuggestionItem
