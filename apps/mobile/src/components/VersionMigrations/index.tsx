import {Typography, useTheme, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useStore} from 'jotai'
import React, {useEffect, useMemo, useState} from 'react'
import {ActivityIndicator} from 'react-native'
import {andThenExpectVoidNoErrors} from '../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {needToRunMigrationAtom} from './atoms'
import migrateContacts from './migrations/contacts'
import {type MigrationProgress} from './types'

export default function VersionMigrations({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const theme = useTheme()
  const store = useStore()
  const needToRunMigration = useMemo(() => {
    return store.get(needToRunMigrationAtom)
  }, [store])

  const [progress, setProgress] = useState<{
    progress: MigrationProgress
    done?: boolean
  }>({
    progress: {percent: 0},
    done: !needToRunMigration,
  })

  useEffect(() => {
    if (!needToRunMigration) return

    void Effect.runPromise(
      andThenExpectVoidNoErrors(() => {
        setProgress({progress: {percent: 100}, done: true})
      })(
        migrateContacts((progress) => {
          setProgress({done: false, progress})
        })
      )
    )
  }, [setProgress, needToRunMigration])

  if (progress.done) return <>{children}</>

  return (
    <YStack
      f={1}
      alignContent="center"
      justifyContent="center"
      backgroundColor="$backgroundPrimary"
      px="$5"
      gap="$3"
    >
      <ActivityIndicator
        color={theme.accentHighlightPrimary.get()}
        size="large"
      />
      <Typography
        variant="paragraph"
        textAlign="center"
        color="$foregroundPrimary"
      >
        {t('migrations.migrating', {
          percentDone: formatInteger(progress.progress.percent, locale),
        })}
      </Typography>
    </YStack>
  )
}
