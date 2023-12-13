import {getTokens, Text} from 'tamagui'
import {Alert, Text as RNText} from 'react-native'
import {FlashList} from '@shopify/flash-list'
import {type Atom, useAtomValue, useStore} from 'jotai'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {appLogAtomsAtom} from '../atoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SecretDoor from '../../SecretDoor'
import {isDeveloperAtom} from '../../../utils/preferences'

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
  const {t} = useTranslation()
  const store = useStore()

  if (logsAtoms.length === 0)
    return (
      <SecretDoor
        onSecretDoorOpen={() => {
          store.set(isDeveloperAtom, true)
          Alert.alert('You are now in a developer mode!')
        }}
      >
        <Text color="white">{t('AppLogs.noLogs')}</Text>
      </SecretDoor>
    )

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
