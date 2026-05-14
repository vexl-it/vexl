import {useNavigation} from '@react-navigation/native'
import {PeopleUsers, ReachStats, type ReachStatsStep} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {fistAndSecondLevelConnectionsReachAtom} from '../../../state/connections/atom/connectionStateAtom'
import {useTranslation as useTranslations} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'

export function AccountReachStats(): React.ReactElement {
  const {t} = useTranslations()
  const navigation =
    useNavigation<RootStackScreenProps<'Account'>['navigation']>()
  const reachNumber = useAtomValue(fistAndSecondLevelConnectionsReachAtom)
  const localizeDecimalNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const localizedReachNumber = localizeDecimalNumber({number: reachNumber})

  const navigateToContacts = useCallback(() => {
    navigation.navigate('SetContacts')
  }, [navigation])

  const steps = useMemo(
    (): readonly ReachStatsStep[] => [
      {
        label: t('account.reachStats.smallPool'),
        range: t('account.reachStats.smallPoolRange'),
        icon: PeopleUsers,
        active: reachNumber > 0 && reachNumber <= 100,
      },
      {
        label: t('account.reachStats.lake'),
        range: t('account.reachStats.lakeRange'),
        icon: PeopleUsers,
        active: reachNumber > 100 && reachNumber <= 500,
      },
      {
        label: t('account.reachStats.ocean'),
        range: t('account.reachStats.oceanRange'),
        icon: PeopleUsers,
        active: reachNumber > 500,
      },
    ],
    [reachNumber, t]
  )

  return (
    <ReachStats
      subtitle={t('account.reachStats.title')}
      headline={
        reachNumber > 0
          ? t('account.reachStats.vexlaksCount', {
              number: localizedReachNumber,
            })
          : t('account.reachStats.noVexlaks')
      }
      steps={steps}
      buttonLabel={t('account.reachStats.addContacts')}
      onButtonPress={navigateToContacts}
    />
  )
}
