import {useEffect, useState} from 'react'
import {Spinner, Text, YStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import migrateContacts from './migrations/contacts'
import {type MigrationProgress} from './types'

export default function VersionMigrations({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [progress, setProgress] = useState<{
    progress: MigrationProgress
    done?: boolean
  }>({
    progress: {percent: 0},
    done: false,
  })
  const {t} = useTranslation()

  useEffect(() => {
    void migrateContacts((progress) => {
      setProgress({done: false, progress})
    }).then(() => {
      setProgress({progress: {percent: 100}, done: true})
    })
  }, [setProgress])

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
