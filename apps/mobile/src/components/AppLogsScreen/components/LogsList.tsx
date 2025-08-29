import {FlashList} from '@shopify/flash-list'
import {useAtomValue, useStore, type Atom} from 'jotai'
import React from 'react'
import {Alert, Text as RNText} from 'react-native'
import {Text, getTokens} from 'tamagui'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../../../utils/preferences'
import SecretDoor from '../../SecretDoor'
import {appLogAtomsAtom} from '../atoms'

const logTextStyle = {
  marginBottom: getTokens().space[2].val,
  color: getTokens().color.white.val,
}

function LogItem({logAtom}: {logAtom: Atom<string>}): React.ReactElement {
  const log = useAtomValue(logAtom)
  return (
    <RNText selectable style={logTextStyle}>
      {log}
    </RNText>
  )
}

function renderLogItem({item}: {item: Atom<string>}): React.ReactElement {
  return <LogItem logAtom={item} />
}

function LogsList(): React.ReactElement {
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
