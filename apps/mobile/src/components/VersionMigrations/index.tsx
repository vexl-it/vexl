import {Effect} from 'effect'
import {useStore} from 'jotai'
import {useEffect, useMemo, useState} from 'react'
import {Spinner, Text, YStack} from 'tamagui'
import {andThenExpectVoidNoErrors} from '../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {needToRunMigrationAtom} from './atoms'
import migrateContacts from './migrations/contacts'
import {type MigrationProgress} from './types'

export default function VersionMigrations({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const {t} = useTranslation()
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
      backgroundColor="$black"
      px="$5"
      gap="$3"
    >
      <Spinner color="$main" size="large"></Spinner>
      <Text textAlign="center" color="white" fos={18}>
        {t('migrations.migrating', {
          percentDone: progress.progress.percent,
        })}
      </Text>
    </YStack>
  )
}
