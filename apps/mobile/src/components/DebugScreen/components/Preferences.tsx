import {Switch, Typography, XStack, YStack} from '@vexl-next/ui'
import {Array} from 'effect'
import {atom, type SetStateAction} from 'jotai'
import React from 'react'
import {preferencesAtom} from '../../../utils/preferences'
import {type Preferences} from '../../../utils/preferences/domain'

const preferencesToEdit = [
  'disableOfferRerequestLimit',
  'allowSendingImages',
  'enableNewOffersNotificationDevMode',
  'showFriendLevelBanner',
  'showTextDebugButton',
  'isDeveloper',
  'showOfferDetail',
  'runTasksInParallel',
  'showVerifiedContacts',
  'notesBoardEnabled',
] satisfies ReadonlyArray<keyof Preferences>

type PreferenceKey = (typeof preferencesToEdit)[number]

function PreferenceSwitch({
  preferenceKey,
}: {
  readonly preferenceKey: PreferenceKey
}): React.ReactElement {
  const preferenceAtom = React.useMemo(
    () =>
      atom(
        (get) => get(preferencesAtom)[preferenceKey],
        (get, set, value: SetStateAction<boolean>) => {
          const current = get(preferencesAtom)[preferenceKey]
          const nextValue = typeof value === 'function' ? value(current) : value

          set(preferencesAtom, (old) => ({
            ...old,
            [preferenceKey]: nextValue,
          }))
        }
      ),
    [preferenceKey]
  )

  return <Switch valueAtom={preferenceAtom} />
}

function DebugPreferences(): React.ReactElement {
  return (
    <YStack gap="$2">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        Preferences
      </Typography>
      {Array.map(preferencesToEdit, (key) => (
        <XStack key={key} alignItems="center" justifyContent="space-between">
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            {key}
          </Typography>
          <PreferenceSwitch preferenceKey={key} />
        </XStack>
      ))}
    </YStack>
  )
}

export default DebugPreferences
