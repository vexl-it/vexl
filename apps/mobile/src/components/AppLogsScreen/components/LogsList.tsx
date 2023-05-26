import {getTokens, Text} from 'tamagui'
import {Text as RNText} from 'react-native'
import {FlashList} from '@shopify/flash-list'
import {type Atom, useAtomValue} from 'jotai'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {appLogAtomsAtom} from '../atoms'

const logTextStyle = {
  marginBottom: getTokens().space[2].val,
  color: getTokens().color.white.val,
}

function LogItem({logAtom}: {logAtom: Atom<string>}): JSX.Element {
  const log = useAtomValue(logAtom)
  return (
    <RNText selectable style={logTextStyle}>
      {log}
    </RNText>
  )
}

function renderLogItem({item}: {item: Atom<string>}): JSX.Element {
  return <LogItem logAtom={item} />
}

function LogsList(): JSX.Element {
  const logsAtoms = useAtomValue(appLogAtomsAtom)

  if (logsAtoms.length === 0) return <Text color="white">No logs</Text>

  return (
    <FlashList
      estimatedItemSize={113}
      data={logsAtoms}
      keyExtractor={atomKeyExtractor}
      renderItem={renderLogItem}
    />
  )
}

export default LogsList
