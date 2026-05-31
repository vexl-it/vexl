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
  const localizedSmallPoolFrom = localizeDecimalNumber({number: 1})
  const localizedSmallPoolTo = localizeDecimalNumber({number: 100})
  const localizedLakeFrom = localizeDecimalNumber({number: 100})
  const localizedLakeTo = localizeDecimalNumber({number: 500})
  const localizedOceanFrom = localizeDecimalNumber({number: 500})

  const navigateToContacts = useCallback(() => {
    navigation.navigate('ContactPreferences')
  }, [navigation])

  const steps = useMemo(
    (): readonly ReachStatsStep[] => [
      {
        label: t('account.reachStats.smallPool'),
        range: t('account.reachStats.smallPoolRange', {
          from: localizedSmallPoolFrom,
          to: localizedSmallPoolTo,
        }),
        icon: PeopleUsers,
        active: reachNumber > 0 && reachNumber <= 100,
      },
      {
        label: t('account.reachStats.lake'),
        range: t('account.reachStats.lakeRange', {
          from: localizedLakeFrom,
          to: localizedLakeTo,
        }),
        icon: PeopleUsers,
        active: reachNumber > 100 && reachNumber <= 500,
      },
      {
        label: t('account.reachStats.ocean'),
        range: t('account.reachStats.oceanRange', {
          from: localizedOceanFrom,
        }),
        icon: PeopleUsers,
        active: reachNumber > 500,
      },
    ],
    [
      localizedLakeFrom,
      localizedLakeTo,
      localizedOceanFrom,
      localizedSmallPoolFrom,
      localizedSmallPoolTo,
      reachNumber,
      t,
    ]
  )

  return (
    <ReachStats
      subtitle={t('account.reachStats.title')}
      headline={
        reachNumber > 0
          ? t('account.reachStats.reachPeopleCount', {
              localizedString: localizedReachNumber,
            })
          : t('account.reachStats.noVexlaks')
      }
      steps={steps}
      buttonLabel={t('account.reachStats.addContacts')}
      onButtonPress={navigateToContacts}
    />
  )
}
