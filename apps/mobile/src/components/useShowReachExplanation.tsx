import {Divider, KeyValueRow, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {
  clubsConnectionsReachAtom,
  fistAndSecondLevelConnectionsReachAtom,
  reachNumberAtom,
} from '../state/connections/atom/connectionStateAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import {formatInteger} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {globalDialogAtom} from './GlobalDialog'

function ReachExplanation(): React.JSX.Element {
  const {t} = useTranslation()
  const contactsReach = useAtomValue(fistAndSecondLevelConnectionsReachAtom)
  const clubsReach = useAtomValue(clubsConnectionsReachAtom)
  const totalReach = useAtomValue(reachNumberAtom)
  const locale = useAtomValue(formattingLocaleAtom)

  return (
    <YStack gap="$3">
      <KeyValueRow
        size="medium"
        label={t('account.reachExplanation.contacts')}
        value={formatInteger(contactsReach, locale)}
      />
      <KeyValueRow
        size="medium"
        label={t('account.reachExplanation.clubs')}
        value={formatInteger(clubsReach, locale)}
      />
      <Divider />
      <KeyValueRow
        size="medium"
        label={t('account.reachExplanation.total')}
        value={formatInteger(totalReach, locale)}
      />
    </YStack>
  )
}

export function useShowReachExplanation(
  scope: 'total' | 'clubs' = 'total'
): () => void {
  const {t} = useTranslation()
  const showDialog = useSetAtom(globalDialogAtom)

  return useCallback(() => {
    Effect.runFork(
      showDialog({
        title:
          scope === 'clubs'
            ? t('clubs.clubsReach')
            : t('account.reachStats.title'),
        subtitle:
          scope === 'clubs'
            ? t('clubs.reachExplanation')
            : t('account.reachExplanation.description'),
        children: scope === 'clubs' ? undefined : <ReachExplanation />,
        positiveButtonText: t('common.gotIt'),
      })
    )
  }, [scope, showDialog, t])
}
