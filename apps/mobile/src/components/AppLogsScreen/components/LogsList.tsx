import {FlashList} from '@shopify/flash-list'
import {Stack, Typography, useTheme} from '@vexl-next/ui'
import {useAtomValue, useStore, type Atom} from 'jotai'
import React from 'react'
import {Alert, Text as RNText} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../../../utils/preferences'
import SecretDoor from '../../SecretDoor'
import {appLogAtomsAtom} from '../atoms'

function getLogTitle(log: string): string {
  const messageDividerIndex = log.indexOf(': ')
  if (messageDividerIndex === -1) return log

  return log.slice(0, messageDividerIndex)
}

function getLogMessage(log: string): string | undefined {
  const messageDividerIndex = log.indexOf(': ')
  if (messageDividerIndex === -1) return undefined

  return log.slice(messageDividerIndex + 2)
}

const LogItem = React.memo(function LogItem({
  logAtom,
}: {
  logAtom: Atom<string>
}): React.ReactElement {
  const log = useAtomValue(logAtom)
  const theme = useTheme()
  const title = getLogTitle(log)
  const message = getLogMessage(log)

  return (
    <Stack
      backgroundColor="$backgroundTertiary"
      borderRadius="$5"
      paddingHorizontal="$4"
      paddingVertical="$4"
      gap="$1"
      marginBottom="$4"
    >
      <RNText
        selectable
        style={{
          color: theme.foregroundPrimary.get(),
          fontSize: 18,
          fontWeight: '600',
          lineHeight: 24,
        }}
      >
        {title}
      </RNText>
      {message ? (
        <RNText
          selectable
          style={{
            color: theme.foregroundSecondary.get(),
            fontSize: 14,
            lineHeight: 19,
          }}
        >
          {message}
        </RNText>
      ) : null}
    </Stack>
  )
})

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
          Alert.alert(t('AppLogs.developerModeEnabled'))
        }}
      >
        <Typography
          color="$foregroundSecondary"
          letterSpacing={0}
          variant="paragraphSmall"
        >
          {t('AppLogs.noLogs')}
        </Typography>
      </SecretDoor>
    )

  return (
    <FlashList
      data={logsAtoms}
      keyExtractor={atomKeyExtractor}
      renderItem={renderLogItem}
      showsVerticalScrollIndicator={false}
    />
  )
}

export default LogsList
