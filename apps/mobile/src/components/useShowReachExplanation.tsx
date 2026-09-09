import {Separator, Typography, XStack, YStack} from '@vexl-next/ui'
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

function ReachRow({
  label,
  count,
}: {
  readonly label: string
  readonly count: number
}): React.JSX.Element {
  const locale = useAtomValue(formattingLocaleAtom)

  return (
    <XStack ai="center" jc="space-between" gap="$4">
      <Typography variant="paragraph" color="$foregroundSecondary" f={1}>
        {label}
      </Typography>
      <Typography variant="paragraphDemibold" color="$foregroundPrimary">
        {formatInteger(count, locale)}
      </Typography>
    </XStack>
  )
}

function ReachExplanation(): React.JSX.Element {
  const {t} = useTranslation()
  const contactsReach = useAtomValue(fistAndSecondLevelConnectionsReachAtom)
  const clubsReach = useAtomValue(clubsConnectionsReachAtom)
  const totalReach = useAtomValue(reachNumberAtom)

  return (
    <YStack gap="$3">
      <ReachRow
        label={t('account.reachExplanation.contacts')}
        count={contactsReach}
      />
      <ReachRow
        label={t('account.reachExplanation.clubs')}
        count={clubsReach}
      />
      <Separator borderColor="$backgroundTertiary" />
      <ReachRow
        label={t('account.reachExplanation.total')}
        count={totalReach}
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
